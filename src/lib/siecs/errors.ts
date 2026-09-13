export class SiecsError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SiecsError';
    this.status = status;
  }
}

export async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return '';
  try {
    const body = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = body.message ?? body.error;
    return typeof message === 'string' ? message : text;
  } catch {
    return text;
  }
}
