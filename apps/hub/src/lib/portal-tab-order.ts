export type PortalTabId = "compliance" | "movements" | "access";

export const DEFAULT_PORTAL_TAB_ORDER: PortalTabId[] = [
  "compliance",
  "movements",
  "access",
];

export const PORTAL_TAB_LABELS: Record<PortalTabId, string> = {
  compliance: "Compliance (PCR)",
  movements: "Movements (PMS)",
  access: "Access register",
};

const VALID_TABS = new Set<PortalTabId>(DEFAULT_PORTAL_TAB_ORDER);

function isPortalTabId(value: unknown): value is PortalTabId {
  return typeof value === "string" && VALID_TABS.has(value as PortalTabId);
}

export function portalTabOrderStorageKey(userKey: string): string {
  return `porttools-hub-tab-order:${userKey}`;
}

export function normalizePortalTabOrder(order: unknown): PortalTabId[] {
  if (!Array.isArray(order)) return DEFAULT_PORTAL_TAB_ORDER;

  const seen = new Set<PortalTabId>();
  const normalized: PortalTabId[] = [];

  for (const item of order) {
    if (!isPortalTabId(item) || seen.has(item)) continue;
    seen.add(item);
    normalized.push(item);
  }

  for (const id of DEFAULT_PORTAL_TAB_ORDER) {
    if (!seen.has(id)) normalized.push(id);
  }

  return normalized.length === DEFAULT_PORTAL_TAB_ORDER.length
    ? normalized
    : DEFAULT_PORTAL_TAB_ORDER;
}

export function loadPortalTabOrder(userKey: string): PortalTabId[] {
  if (typeof window === "undefined") return DEFAULT_PORTAL_TAB_ORDER;

  try {
    const raw = localStorage.getItem(portalTabOrderStorageKey(userKey));
    if (!raw) return DEFAULT_PORTAL_TAB_ORDER;
    return normalizePortalTabOrder(JSON.parse(raw));
  } catch {
    return DEFAULT_PORTAL_TAB_ORDER;
  }
}

export function savePortalTabOrder(userKey: string, order: PortalTabId[]): void {
  localStorage.setItem(
    portalTabOrderStorageKey(userKey),
    JSON.stringify(normalizePortalTabOrder(order))
  );
}

export function portalSessionUserKey(session: {
  type: "port" | "manager" | "reports";
  portCode?: string;
  email?: string;
}): string {
  if (session.type === "manager" && session.email) {
    return `manager:${session.email.trim().toLowerCase()}`;
  }
  if (session.type === "reports" && session.email) {
    return `reports:${session.email.trim().toLowerCase()}`;
  }
  return `port:${(session.portCode ?? "").trim().toUpperCase()}`;
}
