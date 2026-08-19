function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Require a dedicated bearer secret for every maintenance/data-repair route. */
export function rejectUnauthorizedMaintenance(request: Request): Response | null {
  const expected = process.env.MAINTENANCE_SECRET || '';
  if (!expected) {
    return new Response(JSON.stringify({ success: false, message: 'Maintenance API is disabled' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const provided = bearer || request.headers.get('x-maintenance-secret') || '';
  if (!constantTimeEqual(provided, expected)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  return null;
}
