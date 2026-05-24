export const PUBLIC_ERRORS = {
  generic: "Something went wrong. Please try again in a moment.",
  invalidJson: "Invalid request. Please refresh and try again.",
} as const;

export class JsonParseError extends Error {
  constructor() {
    super("Invalid JSON body");
    this.name = "JsonParseError";
  }
}

export function logServerError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, error.stack);
  } else {
    console.error(`[${context}]`, error);
  }
}

export async function withApiErrorHandling(
  context: string,
  fn: () => Promise<Response>
): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    logServerError(context, error);
    if (error instanceof JsonParseError) {
      return Response.json({ error: PUBLIC_ERRORS.invalidJson }, { status: 400 });
    }
    return Response.json({ error: PUBLIC_ERRORS.generic }, { status: 500 });
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new JsonParseError();
  }
}
