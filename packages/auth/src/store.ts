import { hashPassword, verifyPassword } from "./password";

type AuthPortRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  credentials?: { passwordHash: string } | null;
};

type AuthAdminRow = {
  id: string;
  email: string;
  passwordHash: string;
};

/** Minimal Prisma-shaped client for the shared auth schema. */
export type AuthStoreClient = {
  authPort: {
    findFirst(args: {
      where: { code?: string; isActive?: boolean };
      include?: { credentials: true };
    }): Promise<AuthPortRow | null>;
    findUnique(args: {
      where: { code: string } | { id: string };
      include?: { credentials: true };
    }): Promise<AuthPortRow | null>;
    create(args: {
      data: {
        code: string;
        name: string;
        credentials: { create: { passwordHash: string } };
      };
    }): Promise<{ id: string; code: string; name: string }>;
    update(args: {
      where: { id: string };
      data: { code?: string; name?: string; isActive?: boolean };
    }): Promise<{ id: string; code: string; name: string }>;
  };
  authPortCredential: {
    update(args: {
      where: { portId: string };
      data: { passwordHash: string };
    }): Promise<unknown>;
    create(args: {
      data: { portId: string; passwordHash: string };
    }): Promise<unknown>;
    upsert(args: {
      where: { portId: string };
      create: { portId: string; passwordHash: string };
      update: { passwordHash: string };
    }): Promise<unknown>;
  };
  authAdmin: {
    findUnique(args: {
      where: { email: string } | { id: string };
    }): Promise<AuthAdminRow | null>;
    create(args: {
      data: { email: string; passwordHash: string };
    }): Promise<{ id: string; email: string }>;
    update(args: {
      where: { id: string };
      data: { passwordHash: string };
    }): Promise<unknown>;
  };
};

export type ChangeAdminPasswordFailureReason = "invalid_current" | "weak_password";

export type ChangeAdminPasswordResult =
  | { ok: true }
  | { ok: false; reason: ChangeAdminPasswordFailureReason };

export type VerifiedPortLogin = { authPortId: string; code: string };
export type VerifiedAdminLogin = { adminId: string; email: string };

function normalizePortCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createAuthStore(client: AuthStoreClient) {
  return {
    async verifyPortLogin(code: string, password: string): Promise<VerifiedPortLogin | null> {
      const normalized = normalizePortCode(code);
      const authPort = await client.authPort.findFirst({
        where: { code: normalized, isActive: true },
        include: { credentials: true },
      });
      if (!authPort?.credentials) return null;
      if (!(await verifyPassword(password, authPort.credentials.passwordHash))) return null;
      return { authPortId: authPort.id, code: authPort.code };
    },

    async verifyAdminLogin(email: string, password: string): Promise<VerifiedAdminLogin | null> {
      const normalized = normalizeAdminEmail(email);
      const admin = await client.authAdmin.findUnique({ where: { email: normalized } });
      if (!admin) return null;
      if (!(await verifyPassword(password, admin.passwordHash))) return null;
      return { adminId: admin.id, email: admin.email };
    },

    async createPortWithCredential(input: {
      code: string;
      name: string;
      password: string;
    }): Promise<{ id: string; code: string; name: string }> {
      const code = normalizePortCode(input.code);
      const name = input.name.trim();
      return client.authPort.create({
        data: {
          code,
          name,
          credentials: {
            create: { passwordHash: await hashPassword(input.password) },
          },
        },
      });
    },

    async setPortPasswordByAuthPortId(authPortId: string, password: string): Promise<void> {
      const passwordHash = await hashPassword(password);
      await client.authPortCredential.upsert({
        where: { portId: authPortId },
        create: { portId: authPortId, passwordHash },
        update: { passwordHash },
      });
    },

    async setPortPasswordByCode(code: string, password: string): Promise<boolean> {
      const authPort = await client.authPort.findUnique({
        where: { code: normalizePortCode(code) },
        include: { credentials: true },
      });
      if (!authPort) return false;
      await this.setPortPasswordByAuthPortId(authPort.id, password);
      return true;
    },

    async syncAuthPortMeta(
      authPortId: string,
      data: { code?: string; name?: string; isActive?: boolean }
    ): Promise<void> {
      await client.authPort.update({
        where: { id: authPortId },
        data: {
          ...(data.code !== undefined ? { code: normalizePortCode(data.code) } : {}),
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    },

    async findAuthPortByCode(code: string): Promise<AuthPortRow | null> {
      return client.authPort.findUnique({
        where: { code: normalizePortCode(code) },
        include: { credentials: true },
      });
    },

    async ensureAdmin(email: string, password: string): Promise<{ id: string; email: string }> {
      const normalized = normalizeAdminEmail(email);
      const existing = await client.authAdmin.findUnique({ where: { email: normalized } });
      if (existing) return { id: existing.id, email: existing.email };
      return client.authAdmin.create({
        data: {
          email: normalized,
          passwordHash: await hashPassword(password),
        },
      });
    },

    async changeAdminPassword(
      adminId: string,
      currentPassword: string,
      newPassword: string
    ): Promise<ChangeAdminPasswordResult> {
      if (newPassword.length < 8 || newPassword.length > 128) {
        return { ok: false, reason: "weak_password" };
      }

      const admin = await client.authAdmin.findUnique({ where: { id: adminId } });
      if (!admin) {
        return { ok: false, reason: "invalid_current" };
      }

      if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
        return { ok: false, reason: "invalid_current" };
      }

      await client.authAdmin.update({
        where: { id: adminId },
        data: { passwordHash: await hashPassword(newPassword) },
      });

      return { ok: true };
    },
  };
}

export type AuthStore = ReturnType<typeof createAuthStore>;
