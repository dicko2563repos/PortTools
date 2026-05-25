import { normalizePortCode } from "./port-provision";
import type { AuthStore } from "./store";

export const UNIFIED_LOGIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UNIFIED_LOGIN_PORT_CODE_RE = /^[A-Z0-9_-]{1,16}$/;
export const UNIFIED_LOGIN_MAX_PASSWORD_LEN = 128;

export type ResolvedPortIds = {
  publicPortId: string;
  movementsPortId: string;
  code: string;
};

export type UnifiedLoginSuccess =
  | {
      kind: "port";
      authPortId: string;
      portCode: string;
      email: string;
      publicPortId: string;
      movementsPortId: string;
    }
  | {
      kind: "manager";
      managerId: string;
      email: string;
      authPortIds: string[];
      authPortId: string;
      portCode: string;
      publicPortId: string;
      movementsPortId: string;
    }
  | {
      kind: "reports";
      reportsUserId: string;
      email: string;
    };

export type UnifiedLoginPortResolver = {
  byCode(code: string): Promise<ResolvedPortIds | null>;
  byAuthPortId(authPortId: string): Promise<ResolvedPortIds | null>;
  pickManagerAuthPortId(
    authPortIds: string[],
    loginEmail: string
  ): Promise<string | null>;
};

function isValidPassword(password: string): boolean {
  return password.length > 0 && password.length <= UNIFIED_LOGIN_MAX_PASSWORD_LEN;
}

export async function resolveUnifiedLogin(
  store: AuthStore,
  identifier: string,
  password: string,
  resolver: UnifiedLoginPortResolver
): Promise<UnifiedLoginSuccess | null> {
  const trimmed = identifier.trim();
  if (!isValidPassword(password)) return null;

  if (UNIFIED_LOGIN_EMAIL_RE.test(trimmed)) {
    const email = trimmed.toLowerCase();

    const reportsLogin = await store.verifyReportsLogin(email, password);
    if (reportsLogin) {
      return {
        kind: "reports",
        reportsUserId: reportsLogin.reportsUserId,
        email: reportsLogin.email,
      };
    }

    const portEmailManager = await store.verifyManagerLoginForPortEmail(email, password);
    if (portEmailManager) {
      const authPortId = await resolver.pickManagerAuthPortId(
        portEmailManager.authPortIds,
        email
      );
      if (!authPortId) return null;

      const portIds = await resolver.byAuthPortId(authPortId);
      if (!portIds) return null;

      return {
        kind: "manager",
        managerId: portEmailManager.managerId,
        email: portEmailManager.email,
        authPortIds: portEmailManager.authPortIds,
        authPortId,
        portCode: portIds.code,
        publicPortId: portIds.publicPortId,
        movementsPortId: portIds.movementsPortId,
      };
    }

    const managerLogin = await store.verifyManagerLogin(email, password);
    if (managerLogin) {
      const authPortId = await resolver.pickManagerAuthPortId(
        managerLogin.authPortIds,
        email
      );
      if (!authPortId) return null;

      const portIds = await resolver.byAuthPortId(authPortId);
      if (!portIds) return null;

      return {
        kind: "manager",
        managerId: managerLogin.managerId,
        email: managerLogin.email,
        authPortIds: managerLogin.authPortIds,
        authPortId,
        portCode: portIds.code,
        publicPortId: portIds.publicPortId,
        movementsPortId: portIds.movementsPortId,
      };
    }

    return null;
  }

  const code = normalizePortCode(trimmed);
  if (!UNIFIED_LOGIN_PORT_CODE_RE.test(code)) return null;

  const portLogin = await store.verifyPortLogin(code, password);
  if (!portLogin) return null;

  const portIds = await resolver.byCode(code);
  if (!portIds) return null;

  const authPort = await store.getAuthPortById(portLogin.authPortId);
  const email = authPort?.loginEmail ?? "";

  return {
    kind: "port",
    authPortId: portLogin.authPortId,
    portCode: portLogin.code,
    email,
    publicPortId: portIds.publicPortId,
    movementsPortId: portIds.movementsPortId,
  };
}
