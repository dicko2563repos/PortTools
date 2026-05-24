import { SignJWT, jwtVerify } from "jose";
import {
  type OperatorSessionPayload,
  type PortOperatorSession,
  type ReportsOperatorSession,
} from "./operator-session";

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function createOperatorSessionToken(
  payload: OperatorSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyOperatorSessionToken(
  token: string
): Promise<OperatorSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type === "port" && typeof payload.authPortId === "string") {
      if (
        typeof payload.publicPortId !== "string" ||
        typeof payload.movementsPortId !== "string"
      ) {
        return null;
      }
      return {
        type: "port",
        authPortId: payload.authPortId,
        portCode: String(payload.portCode ?? ""),
        email: String(payload.email ?? ""),
        publicPortId: payload.publicPortId,
        movementsPortId: payload.movementsPortId,
      } satisfies PortOperatorSession;
    }
    if (payload.type === "reports" && typeof payload.reportsUserId === "string") {
      return {
        type: "reports",
        reportsUserId: payload.reportsUserId,
        email: String(payload.email ?? ""),
      } satisfies ReportsOperatorSession;
    }
    return null;
  } catch {
    return null;
  }
}
