import { SignJWT, jwtVerify } from "jose";
import type { OperatorSessionPayload } from "./operator-session";

const HUB_IFRAME_SSO_TYP = "hub_iframe_sso";

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

/** Short-lived token passed in iframe URL when hub embeds PCR/PMS/Access. */
export async function createHubIframeSsoToken(
  payload: OperatorSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload, typ: HUB_IFRAME_SSO_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey());
}

export async function verifyHubIframeSsoToken(
  token: string
): Promise<OperatorSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== HUB_IFRAME_SSO_TYP) return null;

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
      };
    }

    if (payload.type === "reports" && typeof payload.reportsUserId === "string") {
      return {
        type: "reports",
        reportsUserId: payload.reportsUserId,
        email: String(payload.email ?? ""),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function appendHubSsoParam(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("hub_sso", token);
  return parsed.toString();
}
