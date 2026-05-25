export { isValidAccessPin, normalizeAccessPin } from "./access-pin";
export { BCRYPT_ROUNDS, hashPassword, verifyPassword } from "./password";
export {
  createAuthStore,
  type AuthStore,
  type AuthStoreClient,
  type ChangeAdminPasswordFailureReason,
  type ChangeAdminPasswordResult,
  type CreateAdminResult,
  type DeleteAdminResult,
  type ResetAdminPasswordWithTokenResult,
  type SetAdminPasswordResult,
  type VerifiedAdminLogin,
  type VerifiedPortLogin,
  type VerifiedPortEmailLogin,
  type VerifiedReportsLogin,
  type VerifiedManagerLogin,
  type CreateManagerResult,
  type SetManagerPasswordResult,
} from "./store";
export {
  ADMIN_RESET_TOKEN_TTL_MS,
  generateAdminResetToken,
  hashAdminResetToken,
} from "./admin-reset-token";
export {
  isResendConfigured,
  sendAdminPasswordResetEmail,
  sendResendEmail,
} from "./resend-mail";
export { clientIpFromRequest } from "./client-ip";
export {
  checkLoginRateLimit,
  resetLoginRateLimitMemoryForTests,
  type LoginRateLimitResult,
  type LoginRateLimitScope,
} from "./login-rate-limit";
export {
  provisionPortEverywhere,
  syncPortMetaEverywhere,
  normalizePortCode,
  type PortProvisionTx,
  type ProvisionPortInput,
  type ProvisionPortResult,
  type SyncPortMetaInput,
} from "./port-provision";
export {
  PORTTOOLS_SESSION_COOKIE,
  porttoolsSessionCookieOptions,
  getPorttoolsCookieDomain,
  operatorPortalFrameAncestorsHeader,
  type OperatorSessionPayload,
  type PortOperatorSession,
  type ReportsOperatorSession,
  type ManagerOperatorSession,
} from "./operator-session";
export {
  createOperatorSessionToken,
  verifyOperatorSessionToken,
} from "./operator-session-jwt";
export {
  appendHubSsoParam,
  createHubIframeSsoToken,
  hubSsoBridgeUrl,
  safeReturnPath,
  verifyHubIframeSsoToken,
} from "./hub-iframe-sso";
export {
  resolveUnifiedLogin,
  UNIFIED_LOGIN_EMAIL_RE,
  UNIFIED_LOGIN_MAX_PASSWORD_LEN,
  UNIFIED_LOGIN_PORT_CODE_RE,
  type ResolvedPortIds,
  type UnifiedLoginPortResolver,
  type UnifiedLoginSuccess,
} from "./unified-login";
export { createUnifiedLoginPortResolver } from "./unified-login-resolver";
export {
  unifiedLoginRedirectPath,
  type LoginEntryApp,
  type UnifiedLoginRedirectOptions,
} from "./unified-login-redirect";
export { operatorSessionFromUnifiedLogin } from "./operator-session-build";
export {
  handleUnifiedLoginRequest,
  type UnifiedLoginApiResult,
  type UnifiedLoginRequestBody,
} from "./unified-login-api";
export {
  ASIC_REMINDER_DAYS,
  asicReminderLinesForRecords,
  buildAsicReminderEmail,
  buildComplianceReminderEmail,
  type AsicReminderLine,
} from "./reminders";
export { isAuthorizedCronRequest } from "./cron-auth";
export function normalizePortLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}
