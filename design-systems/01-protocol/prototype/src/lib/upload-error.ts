export interface UploadErrorClassification {
  status: number;
  message: string;
  code?: string;
  retryable: boolean;
}

function hasRedisOom(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current = error;
  for (let depth = 0; depth < 8 && current !== null && current !== undefined && !seen.has(current); depth += 1) {
    seen.add(current);
    const message = current instanceof Error
      ? current.message
      : typeof current === 'object' && typeof (current as any).message === 'string'
        ? (current as any).message
        : String(current);
    if (/\bOOM command not allowed\b/i.test(message)) return true;
    current = typeof current === 'object' ? (current as any).cause : undefined;
  }
  return false;
}

export function classifyUploadError(error: unknown): UploadErrorClassification {
  if (hasRedisOom(error)) {
    return {
      status: 503,
      message: 'Token storage is temporarily full; retry shortly',
      code: 'redis_oom',
      retryable: true,
    };
  }
  if (error instanceof Error && error.message === 'Token update is busy; retry on the next agent run') {
    return {
      status: 409,
      message: 'Another token upload is already running; retry shortly.',
      retryable: true,
    };
  }
  if (error instanceof Error && /^Invalid Codex ledger/.test(error.message)) {
    return { status: 400, message: error.message, retryable: false };
  }
  return { status: 500, message: 'Server error', retryable: false };
}
