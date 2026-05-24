import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Shown to airport staff and admins in the UI */
export const PUBLIC_ERRORS = {
  generic: "Something went wrong. Please try again in a moment.",
  notFound: "The requested item could not be found.",
  forbidden: "You do not have permission to do that.",
  unavailable: "This service is temporarily unavailable. Please try again later.",
  saveFailed: "Your changes could not be saved. Please try again.",
  loadFailed: "We could not load this page. Please refresh and try again.",
  importFailed: "Import failed. Check the file and try again.",
  configError: "This port is not fully configured. Contact an administrator.",
  invalidJson: "Invalid request. Please refresh and try again.",
  emailFailed:
    "We could not send the report email. Please try again later or contact support.",
} as const;

export type DomainErrorHandler = {
  test: (error: unknown) => boolean;
  status: number;
  message: string;
};

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

function prismaPublicMessage(error: Prisma.PrismaClientKnownRequestError): string {
  switch (error.code) {
    case "P2002":
      return "That record already exists.";
    case "P2025":
      return PUBLIC_ERRORS.notFound;
    case "P2003":
      return PUBLIC_ERRORS.saveFailed;
    default:
      return PUBLIC_ERRORS.generic;
  }
}

export function handleApiError(
  context: string,
  error: unknown,
  options: { domain?: DomainErrorHandler[]; fallback?: string } = {}
): NextResponse {
  logServerError(context, error);

  for (const handler of options.domain ?? []) {
    if (handler.test(error)) {
      return NextResponse.json({ error: handler.message }, { status: handler.status });
    }
  }

  if (error instanceof JsonParseError) {
    return NextResponse.json({ error: PUBLIC_ERRORS.invalidJson }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      error.code === "P2025" ? 404 : error.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: prismaPublicMessage(error) }, { status });
  }

  return NextResponse.json(
    { error: options.fallback ?? PUBLIC_ERRORS.generic },
    { status: 500 }
  );
}

export async function withApiErrorHandling(
  context: string,
  fn: () => Promise<NextResponse>,
  options?: { domain?: DomainErrorHandler[]; fallback?: string }
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return handleApiError(context, error, options);
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new JsonParseError();
  }
}
