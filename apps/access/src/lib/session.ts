import {
  PORTTOOLS_SESSION_COOKIE,
  verifyOperatorSessionToken,
} from "@porttools/auth";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "porttools_access_session";

export type SessionPayload =
  | {
      type: "manager";
      managerId: string;
      email: string;
      authPortIds: string[];
    }
  | {
      type: "port";
      authPortId: string;
      movementsPortId: string;
      portCode: string;
      email: string;
    };

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type === "manager" && typeof payload.managerId === "string") {
      const authPortIds = Array.isArray(payload.authPortIds)
        ? payload.authPortIds.filter((id): id is string => typeof id === "string")
        : [];
      return {
        type: "manager",
        managerId: payload.managerId,
        email: String(payload.email ?? ""),
        authPortIds,
      };
    }
    if (payload.type === "port" && typeof payload.authPortId === "string") {
      return {
        type: "port",
        authPortId: payload.authPortId,
        movementsPortId: String(payload.movementsPortId ?? ""),
        portCode: String(payload.portCode ?? ""),
        email: String(payload.email ?? ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) return session;
  }

  const operatorToken = cookieStore.get(PORTTOOLS_SESSION_COOKIE)?.value;
  if (!operatorToken) return null;

  const operator = await verifyOperatorSessionToken(operatorToken);
  if (!operator) return null;

  if (operator.type === "port") {
    return {
      type: "port",
      authPortId: operator.authPortId,
      movementsPortId: operator.movementsPortId,
      portCode: operator.portCode,
      email: operator.email,
    };
  }

  if (operator.type === "manager") {
    return {
      type: "manager",
      managerId: operator.managerId,
      email: operator.email,
      authPortIds: operator.authPortIds,
    };
  }

  return null;
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
