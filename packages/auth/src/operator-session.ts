export const PORTTOOLS_SESSION_COOKIE = "porttools_session";

export type PortOperatorSession = {
  type: "port";
  authPortId: string;
  portCode: string;
  email: string;
  publicPortId: string;
  movementsPortId: string;
};

export type ReportsOperatorSession = {
  type: "reports";
  reportsUserId: string;
  email: string;
};

export type OperatorSessionPayload = PortOperatorSession | ReportsOperatorSession;

/** Shared across hub and (future) PCR/PMS SSO. Set PORTTOOLS_COOKIE_DOMAIN in non-prod if needed. */
export function getPorttoolsCookieDomain(): string | undefined {
  const explicit = process.env.PORTTOOLS_COOKIE_DOMAIN?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "production") return ".porttools.com.au";
  return undefined;
}

export function porttoolsSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  domain?: string;
} {
  const domain = getPorttoolsCookieDomain();
  // No maxAge — browser session cookie; JWT expiry is the backstop (24h).
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

/** CSP value so PCR/PMS/Access can load inside the hub portal iframe. */
export function operatorPortalFrameAncestorsHeader(): string {
  const origins = new Set(["'self'", "https://porttools.com.au", "https://www.porttools.com.au"]);
  const hubUrl = process.env.NEXT_PUBLIC_HUB_APP_URL?.trim();
  if (hubUrl) origins.add(hubUrl);
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
  }
  return `frame-ancestors ${[...origins].join(" ")}`;
}
