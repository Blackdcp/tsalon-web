import type { APIRoute } from 'astro';
import { getUserIdByToken, updateTokenUsage, kv } from '../../../lib/kv';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, data, device_id, reset } = body;

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
      const tsKeys = await kv.keys(`user:${userId}:timeseries:*`);
      if (tsKeys.length > 0) await kv.del(...tsKeys);
      const devKeys = await kv.keys(`user:${userId}:device:*`);
      if (devKeys.length > 0) await kv.del(...devKeys);
      return new Response(JSON.stringify({ success: true, message: 'User data reset' }), { status: 200 });
    }

    // Since our token agent doesn't send name/image, we need to get it from KV where auth saved it.
    const rawInfo = await kv.get(`user:${userId}:info`);
    const userInfo = rawInfo ? JSON.parse(rawInfo) : null;
    const name = userInfo?.name || 'Anonymous Developer';
    const image = userInfo?.image || '/icon-512x512.png';

    // Extract all dynamic tokens, ensuring they are numbers
    const dynamicTokens: Record<string, number> = {};
    const historyData = data.history || null;
    
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'total' && key !== 'history') {
        if (typeof val === 'object' && val !== null) {
          dynamicTokens[key] = Number((val as any).total) || 0;
        } else {
          dynamicTokens[key] = Number(val) || 0;
        }
      }
    }

    await updateTokenUsage(userId, name, image, dynamicTokens, actualDeviceId, historyData);

    return new Response(JSON.stringify({ success: true, message: 'Tokens updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
};
