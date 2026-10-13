import type { APIRoute } from 'astro';
import { getUserIdByToken, updateTokenUsage, kv } from '../../../lib/kv';
import { storeAccountAuditWithTimeout } from '../../../lib/codex-ledger.ts';
import { readUploadJson, UploadBodyError } from '../../../lib/upload-body.ts';
import { classifyUploadError } from '../../../lib/upload-error.ts';
import { stageUploadPart, readUploadParts, readUploadReceipt, releaseUploadParts, uploadPartsKey, uploadReceiptKey } from '../../../lib/upload-parts.ts';
import { claimDeviceUploadWindow, completeDeviceUploadWindow, releaseDeviceUploadWindow, normalizeUploadDeviceId } from '../../../lib/upload-cadence.ts';

const REQUIRED_SCHEDULE_VERSION = 3;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let releaseUpload: (() => Promise<void>) | undefined;
  let releaseParts: (() => Promise<void>) | undefined;
  try {
    const body = await readUploadJson(request);
    const { token, data, device_id, reset, history_complete_tools } = body;
    const codexLedger = body.codex_ledger?.version === 5 ? body.codex_ledger : null;

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: 'Missing token' }), { status: 400 });
    }
    
    // Fallback if older agent is used
    const actualDeviceId = normalizeUploadDeviceId(device_id);

    const userId = await getUserIdByToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 401 });
    }
    
    if (!kv) {
      return new Response(JSON.stringify({ success: false, message: 'KV Database not configured' }), { status: 500 });
    }
    
    if (reset) {
      // An upload token is stored on each device and is not an administrative
      // credential. Never allow it to erase server data if copied or leaked.
      return new Response(JSON.stringify({ success: false, message: 'Reset requires the maintenance API' }), { status: 403 });
    }

    if (body.upload_part) {
      await stageUploadPart(kv, userId, actualDeviceId, body.upload_part);
      return Response.json({ success: true, staged: true });
    }
    const uploadId = codexLedger?.upload_id;
    if (uploadId !== undefined) {
      if (codexLedger.records !== undefined) throw new Error('Invalid Codex ledger upload batch');
      const receipt = await readUploadReceipt(kv, userId, actualDeviceId, uploadId);
      if (receipt) return Response.json(receipt);
    }

    // Allow two successful uploads per device per Beijing calendar day. Claim
    // before expensive reads/writes; stale schedules and concurrent requests skip.
    const uploadLease = await claimDeviceUploadWindow(kv, userId, actualDeviceId);
    if ('reason' in uploadLease) {
      if (uploadId !== undefined) {
        const completed = await readUploadReceipt(kv, userId, actualDeviceId, uploadId);
        if (completed) return Response.json(completed);
      }
      const inFlight = uploadLease.reason === 'upload_in_flight';
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: inFlight ? 'Another upload is still running; retry shortly'
          : 'Daily upload limit reached (2 successful uploads per Beijing day)',
        code: uploadLease.reason,
        retryable: inFlight,
        retry_after_seconds: uploadLease.retryAfterSeconds,
        required_schedule_version: REQUIRED_SCHEDULE_VERSION,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    releaseUpload = () => releaseDeviceUploadWindow(kv, userId, actualDeviceId, uploadLease);
    if (uploadId !== undefined) {
      const completed = await readUploadReceipt(kv, userId, actualDeviceId, uploadId);
      if (completed) {
        await releaseUpload();
        releaseUpload = undefined;
        return Response.json(completed);
      }
      releaseParts = () => releaseUploadParts(kv, userId, actualDeviceId, uploadId, uploadLease.owner);
      codexLedger.records = await readUploadParts(kv, userId, actualDeviceId, uploadId, uploadLease.owner);
    }

    // Since our token agent doesn't send name/image, we need to get it from KV where auth saved it.
    const rawInfo = await kv.get(`user:${userId}:info`);
    const userInfo = rawInfo ? JSON.parse(rawInfo) : null;
    // The user wants the GitHub DISPLAY NAME (e.g. "Black." / "Ross L"), not the
    // username/login. Prefer display name, fall back to login, then a label.
    const name = userInfo?.name || userInfo?.login || 'Anonymous Developer';
    const image = userInfo?.image || '/icon-512x512.png';

    // Preserve the full breakdown {total, in, out, cache_read, cache_write} when
    // the agent sends an object, so cost can be billed from the real in/out/cache
    // instead of a fabricated total*0.9/0.1 split with cache_read=0.
    const dynamicTokens: Record<string, any> = {};
    const historyData = data.history || null;

    for (const [key, val] of Object.entries(data)) {
      if (key !== 'total' && key !== 'history') {
        if (typeof val === 'object' && val !== null) {
          dynamicTokens[key] = val;
        } else {
          dynamicTokens[key] = Number(val) || 0;
        }
      }
    }

    const historyCompleteTools = Array.isArray(history_complete_tools)
      ? history_complete_tools.filter((t: unknown): t is string => typeof t === 'string')
      : [];

    // The official account snapshot must exist before the v5 ledger rebuild so
    // that its authoritative daily/lifetime totals are published atomically
    // with this upload. A Redis failure or timeout remains non-blocking.
    const accountAudit = body.account_audit !== undefined && body.account_audit !== null
      ? await storeAccountAuditWithTimeout(kv, userId, body.account_audit)
      : null;

    const result = await updateTokenUsage(
      userId,
      name,
      image,
      dynamicTokens,
      actualDeviceId,
      {
        historyData,
        historyCompleteTools,
        codexLedger,
      },
    );
    let officialDelta = null;
    if (accountAudit) {
      const ledgerLifetimeTokens = Number(result?.codex?.total) || 0;
      officialDelta = {
        account_audit_key: accountAudit.account_audit_key,
        official_lifetime_tokens: accountAudit.lifetime_tokens,
        ledger_lifetime_tokens: ledgerLifetimeTokens,
        difference_tokens: ledgerLifetimeTokens - accountAudit.lifetime_tokens,
      };
    }

    const receipt = {
      success: true,
      message: 'Tokens updated',
      schema_version: 5,
      codex: result?.codex ?? null,
      pricing_snapshot_date: result?.pricing_snapshot_date ?? null,
      official_delta: officialDelta,
      required_schedule_version: REQUIRED_SCHEDULE_VERSION,
    };
    // The receipt and daily count are one atomic operation. A lost response can
    // be retried without publishing partial data or spending a second allowance.
    await completeDeviceUploadWindow(kv, userId, actualDeviceId, uploadLease, Date.now(), uploadId === undefined ? undefined : {
      key: uploadPartsKey(userId, actualDeviceId), receiptKey: uploadReceiptKey(userId, actualDeviceId, uploadId), batchId: uploadId, value: JSON.stringify(receipt),
    });
    releaseUpload = undefined;
    releaseParts = undefined;
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // A rejected payload or failed update must not lock out a corrected retry.
    // Compare-owner release cannot delete another worker's newer lease.
    try { await releaseParts?.(); } catch (releaseError) { console.error(releaseError); }
    try { await releaseUpload?.(); } catch (releaseError) { console.error(releaseError); }
    console.error(error);
    if (error instanceof UploadBodyError) {
      return new Response(JSON.stringify({ success: false, message: error.message, schema_version: 5, required_schedule_version: REQUIRED_SCHEDULE_VERSION }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const classified = classifyUploadError(error);
    return new Response(JSON.stringify({
      success: false,
      message: classified.message,
      ...(classified.code ? { code: classified.code } : {}),
      retryable: classified.retryable,
      schema_version: 5,
      required_schedule_version: REQUIRED_SCHEDULE_VERSION,
    }), {
      status: classified.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
