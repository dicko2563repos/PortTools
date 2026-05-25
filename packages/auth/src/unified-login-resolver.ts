import type { UnifiedLoginPortResolver } from "./unified-login";

type AuthPortLookup = {
  findUnique(args: {
    where: { code: string } | { id: string };
    select: { id: true; code: true };
  }): Promise<{ id: string; code: string } | null>;
  findMany(args: {
    where: { id: { in: string[] }; isActive: true };
    orderBy: { code: "asc" };
    select: { id: true; loginEmail: true };
  }): Promise<Array<{ id: string; loginEmail: string | null }>>;
};

type PublicPortLookup = {
  findUnique(args: {
    where: { code: string };
    select: { id: true; code: true };
  }): Promise<{ id: string; code: string } | null>;
};

type MovementsPortLookup = {
  findUnique(args: {
    where: { code: string };
    select: { id: true; code: true };
  }): Promise<{ id: string; code: string } | null>;
};

/** Build port ID resolver for unified login using app Prisma clients. */
export function createUnifiedLoginPortResolver(deps: {
  authPort: AuthPortLookup;
  publicPort: PublicPortLookup;
  movementsPort: MovementsPortLookup;
}): UnifiedLoginPortResolver {
  async function resolveByCode(code: string) {
    const [publicPort, movementsPort] = await Promise.all([
      deps.publicPort.findUnique({ where: { code }, select: { id: true, code: true } }),
      deps.movementsPort.findUnique({ where: { code }, select: { id: true, code: true } }),
    ]);
    if (!publicPort || !movementsPort) return null;
    return {
      publicPortId: publicPort.id,
      movementsPortId: movementsPort.id,
      code,
    };
  }

  return {
    byCode: resolveByCode,
    async byAuthPortId(authPortId) {
      const authPort = await deps.authPort.findUnique({
        where: { id: authPortId },
        select: { id: true, code: true },
      });
      if (!authPort) return null;
      return resolveByCode(authPort.code);
    },
    async pickManagerAuthPortId(authPortIds, loginEmail) {
      const ports = await deps.authPort.findMany({
        where: { id: { in: authPortIds }, isActive: true },
        orderBy: { code: "asc" },
        select: { id: true, loginEmail: true },
      });
      const normalized = loginEmail.trim().toLowerCase();
      const matched = ports.find(
        (port) => port.loginEmail?.trim().toLowerCase() === normalized
      );
      return matched?.id ?? ports[0]?.id ?? null;
    },
  };
}
