import { resolveUnifiedLogin, type UnifiedLoginPortResolver, type UnifiedLoginSuccess } from "./unified-login";
import { operatorSessionFromUnifiedLogin } from "./operator-session-build";
import {
  unifiedLoginRedirectPath,
  type LoginEntryApp,
  type UnifiedLoginRedirectOptions,
} from "./unified-login-redirect";
import type { AuthStore } from "./store";

export type UnifiedLoginRequestBody = {
  identifier?: string;
  password?: string;
  entryApp?: LoginEntryApp;
};

export type UnifiedLoginApiResult =
  | {
      ok: true;
      type: UnifiedLoginSuccess["kind"];
      redirect: string;
      session: ReturnType<typeof operatorSessionFromUnifiedLogin>;
      login: UnifiedLoginSuccess;
    }
  | { ok: false; error: string; status: 401 | 429 | 503 };

export async function handleUnifiedLoginRequest(input: {
  body: UnifiedLoginRequestBody;
  store: AuthStore;
  resolver: UnifiedLoginPortResolver;
  defaultEntryApp: LoginEntryApp;
  redirectOptions?: UnifiedLoginRedirectOptions;
}): Promise<UnifiedLoginApiResult> {
  const identifier = input.body.identifier?.trim() ?? "";
  const password = input.body.password ?? "";
  const entryApp = input.body.entryApp ?? input.defaultEntryApp;

  const result = await resolveUnifiedLogin(
    input.store,
    identifier,
    password,
    input.resolver
  );

  if (!result) {
    return { ok: false, error: "Invalid credentials", status: 401 };
  }

  if (
    (result.kind === "port" || result.kind === "manager") &&
    !result.publicPortId
  ) {
    return {
      ok: false,
      error: "Port is not fully configured. Contact an administrator.",
      status: 503,
    };
  }

  const redirect = unifiedLoginRedirectPath(result, entryApp, input.redirectOptions);

  return {
    ok: true,
    type: result.kind,
    redirect,
    session: operatorSessionFromUnifiedLogin(result),
    login: result,
  };
}
