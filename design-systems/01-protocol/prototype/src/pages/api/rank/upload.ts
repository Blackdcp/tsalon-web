import type { APIRoute } from 'astro';
import { getUserIdByToken, updateTokenUsage, kv } from '../../../lib/kv';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, data, device_id, reset, history_complete_tools } = body;

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: 'Missing token' }), { status: 400 });
    }
    
    // Fallback if older agent is used
    const actualDeviceId = device_id || 'default_device';

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

    await updateTokenUsage(
      userId,
      name,
      image,
      dynamicTokens,
      actualDeviceId,
      historyData,
      historyCompleteTools,
    );

    return new Response(JSON.stringify({ success: true, message: 'Tokens updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
};
