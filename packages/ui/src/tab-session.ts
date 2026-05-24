/** sessionStorage keys — scoped per origin (admin vs access subdomains). */
export const TAB_SESSION_KEYS = {
  admin: "porttools_admin_tab",
  access: "porttools_access_tab",
} as const;

export function markTabSessionActive(key: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(key, "1");
  }
}

export function clearTabSession(key: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(key);
  }
}

export function hasTabSession(key: string): boolean {
  return typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1";
}
