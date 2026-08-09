import type { APIRoute } from 'astro';
import { getUserIdByToken, updateTokenUsage, kv } from '../../../lib/kv';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, data } = body;

    if (!token) {
      return new Response(JSON.stringify({ success: false, message: 'Missing token' }), { status: 400 });
    }

    const userId = await getUserIdByToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 401 });
    }

    // Since our token agent doesn't send name/image, we need to get it from KV where auth saved it,
    // or we can fetch it. For now, let's assume we saved it during auth login or we get it from auth session.
    // Wait, the API receives the request from the CLI agent, so no browser session cookie exists.
    const rawInfo = await kv.get(`user:${userId}:info`);
    const userInfo = rawInfo ? JSON.parse(rawInfo) : null;
    const name = userInfo?.name || 'Anonymous Developer';
    const image = userInfo?.image || '/icon-512x512.png';

    const cursor = Number(data.cursor) || 0;
    const claude = Number(data.claude) || 0;

    await updateTokenUsage(userId, name, image, cursor, claude);

    return new Response(JSON.stringify({ success: true, message: 'Tokens updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
};
