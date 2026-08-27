export interface UploadErrorClassification {
  status: number;
  message: string;
  retryable: boolean;
}

export function classifyUploadError(error: unknown): UploadErrorClassification {
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
