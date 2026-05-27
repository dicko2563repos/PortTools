import { SignJWT, jwtVerify } from "jose";
import { getPorttoolsCookieDomain } from "./operator-session";

export const PORTTOOLS_ADMIN_SESSION_COOKIE = "porttools_admin_session";

export type AdminSessionPayload = {
  type: "admin";
  adminId: string;
  email: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export function adminSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  domain?: string;
} {
  const domain = getPorttoolsCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export async function createAdminSessionToken(
  payload: AdminSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type === "admin" && typeof payload.adminId === "string") {
      return {
        type: "admin",
        adminId: payload.adminId,
        email: String(payload.email ?? ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}

const ADMIN_CROSS_APP_SSO_TYP = "admin_cross_app_sso";

export type AdminCrossAppSsoPayload = AdminSessionPayload & {
  returnPath: string;
};

/** Short-lived token for opening PCR/PMS admin views from the central admin console. */
export async function createAdminCrossAppSsoToken(input: {
  adminId: string;
  email: string;
  returnPath: string;
}): Promise<string> {
  return new SignJWT({
    type: "admin",
    adminId: input.adminId,
    email: input.email,
    returnPath: input.returnPath,
    typ: ADMIN_CROSS_APP_SSO_TYP,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey());
}

export async function verifyAdminCrossAppSsoToken(
  token: string
): Promise<AdminCrossAppSsoPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== ADMIN_CROSS_APP_SSO_TYP) return null;
    if (payload.type !== "admin" || typeof payload.adminId !== "string") return null;
    const returnPath =
      typeof payload.returnPath === "string" ? payload.returnPath : "/";
    if (!returnPath.startsWith("/") || returnPath.startsWith("//")) return null;
    return {
      type: "admin",
      adminId: payload.adminId,
      email: String(payload.email ?? ""),
      returnPath,
    };
  } catch {
    return null;
  }
}

export function adminCrossAppSsoBridgeUrl(
  appOrigin: string,
  returnPath: string,
  token: string
): string {
  const parsed = new URL("/api/auth/admin-sso", appOrigin);
  parsed.searchParams.set("return", returnPath);
  parsed.searchParams.set("admin_sso", token);
  return parsed.toString();
}
