import { verifyHubIframeSsoToken } from "@porttools/auth";
import { setSessionCookie } from "./session";

export async function tryEstablishSessionFromHubSso(
  hubSso: string | undefined
): Promise<boolean> {
  if (!hubSso?.trim()) return false;

  const operator = await verifyHubIframeSsoToken(hubSso.trim());
  if (!operator || operator.type !== "port") return false;

  await setSessionCookie({
    type: "port",
    authPortId: operator.authPortId,
    movementsPortId: operator.movementsPortId,
    portCode: operator.portCode,
    email: operator.email,
  });
  return true;
}
