import type { OperatorSessionPayload } from "./operator-session";
import type { UnifiedLoginSuccess } from "./unified-login";

export function operatorSessionFromUnifiedLogin(
  result: UnifiedLoginSuccess
): OperatorSessionPayload {
  if (result.kind === "reports") {
    return {
      type: "reports",
      reportsUserId: result.reportsUserId,
      email: result.email,
    };
  }

  if (result.kind === "manager") {
    return {
      type: "manager",
      managerId: result.managerId,
      email: result.email,
      authPortIds: result.authPortIds,
      authPortId: result.authPortId,
      portCode: result.portCode,
      publicPortId: result.publicPortId,
      movementsPortId: result.movementsPortId,
    };
  }

  return {
    type: "port",
    authPortId: result.authPortId,
    portCode: result.portCode,
    email: result.email,
    publicPortId: result.publicPortId,
    movementsPortId: result.movementsPortId,
  };
}
