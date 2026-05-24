const TECHNICAL_PATTERNS = [
  /prisma/i,
  /\bP20\d{2}\b/,
  /RESEND_API_KEY|EMAIL_FROM|DATABASE_URL|SESSION_SECRET/,
  /at\s+\S+\s+\(/,
  /\.env\b/i,
  /db:seed/i,
  /resend\.com/i,
];

export function safeApiError(apiError: unknown, fallback: string): string {
  if (typeof apiError !== "string" || apiError.length === 0) return fallback;
  if (apiError.length > 300) return fallback;
  if (TECHNICAL_PATTERNS.some((re) => re.test(apiError))) return fallback;
  return apiError;
}

export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    return safeApiError(data.error, fallback);
  } catch {
    return fallback;
  }
}
