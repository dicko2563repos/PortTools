import type { UnifiedLoginSuccess } from "./unified-login";

export type LoginEntryApp = "hub" | "pcr" | "pms" | "access";

export type UnifiedLoginRedirectOptions = {
  /** When reports users sign in outside PMS/hub, send them to PMS reports. */
  pmsOrigin?: string;
};

export function unifiedLoginRedirectPath(
  result: UnifiedLoginSuccess,
  entryApp: LoginEntryApp,
  options: UnifiedLoginRedirectOptions = {}
): string {
  if (result.kind === "reports") {
    if (entryApp === "pms") return "/reports";
    if (entryApp === "hub") return "/portal";
    if (options.pmsOrigin) {
      return `${options.pmsOrigin.replace(/\/$/, "")}/reports`;
    }
    return "/reports";
  }

  switch (entryApp) {
    case "hub":
      return "/portal";
    case "pcr":
      return "/port/record";
    case "pms":
      return "/port/movements";
    case "access":
      return `/ports/${result.movementsPortId}/access`;
    default:
      return "/portal";
  }
}
