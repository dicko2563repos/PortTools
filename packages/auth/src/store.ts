import { hashPassword, verifyPassword } from "./password";
import {
  ADMIN_RESET_TOKEN_TTL_MS,
  generateAdminResetToken,
  hashAdminResetToken,
} from "./admin-reset-token";

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
  createdAt?: Date;
};

type AdminPasswordResetTokenRow = {
  id: string;
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

type ReportsUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
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
    findMany(args: {
      orderBy: { email: "asc" | "desc" };
      select: { id: true; email: true; createdAt: true };
    }): Promise<Array<{ id: string; email: string; createdAt: Date }>>;
    count(): Promise<number>;
    create(args: {
      data: { email: string; passwordHash: string };
    }): Promise<{ id: string; email: string }>;
    update(args: {
      where: { id: string };
      data: { passwordHash: string };
    }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
  };
  adminPasswordResetToken: {
    deleteMany(args: {
      where: { adminId: string; usedAt?: null };
    }): Promise<unknown>;
    create(args: {
      data: {
        adminId: string;
        tokenHash: string;
        expiresAt: Date;
      };
    }): Promise<AdminPasswordResetTokenRow>;
    findFirst(args: {
      where: {
        tokenHash: string;
        usedAt: null;
        expiresAt: { gt: Date };
      };
    }): Promise<AdminPasswordResetTokenRow | null>;
    update(args: {
      where: { id: string };
      data: { usedAt: Date };
    }): Promise<unknown>;
  };
  reportsUser: {
    findUnique(args: {
      where: { email: string } | { id: string };
    }): Promise<ReportsUserRow | null>;
    create(args: {
      data: { email: string; passwordHash: string; isActive?: boolean };
    }): Promise<{ id: string; email: string }>;
    update(args: {
      where: { id: string };
      data: { passwordHash?: string; isActive?: boolean };
    }): Promise<unknown>;
  };
};

export type ChangeAdminPasswordFailureReason = "invalid_current" | "weak_password";

export type ChangeAdminPasswordResult =
  | { ok: true }
  | { ok: false; reason: ChangeAdminPasswordFailureReason };

export type CreateAdminResult =
  | { ok: true; admin: { id: string; email: string } }
  | { ok: false; reason: "duplicate" | "weak_password" };

export type DeleteAdminResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "last_admin" };

export type SetAdminPasswordResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "weak_password" };

export type ResetAdminPasswordWithTokenResult =
  | { ok: true }
  | { ok: false; reason: "invalid_or_expired" | "weak_password" };

export type VerifiedPortLogin = { authPortId: string; code: string };
export type VerifiedAdminLogin = { adminId: string; email: string };
export type VerifiedReportsLogin = { reportsUserId: string; email: string };

function normalizePortCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeReportsEmail(email: string): string {
  return normalizeAdminEmail(email);
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
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

    async verifyReportsLogin(email: string, password: string): Promise<VerifiedReportsLogin | null> {
      const normalized = normalizeReportsEmail(email);
      const user = await client.reportsUser.findUnique({ where: { email: normalized } });
      if (!user || !user.isActive) return null;
      if (!(await verifyPassword(password, user.passwordHash))) return null;
      return { reportsUserId: user.id, email: user.email };
    },

    async createReportsUser(input: {
      email: string;
      password: string;
      isActive?: boolean;
    }): Promise<{ id: string; email: string }> {
      const email = normalizeReportsEmail(input.email);
      return client.reportsUser.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
    },

    async setReportsUserPassword(reportsUserId: string, password: string): Promise<void> {
      await client.reportsUser.update({
        where: { id: reportsUserId },
        data: { passwordHash: await hashPassword(password) },
      });
    },

    async setReportsUserActive(reportsUserId: string, isActive: boolean): Promise<void> {
      await client.reportsUser.update({
        where: { id: reportsUserId },
        data: { isActive },
      });
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

    async listAdmins(): Promise<Array<{ id: string; email: string; createdAt: Date }>> {
      return client.authAdmin.findMany({
        orderBy: { email: "asc" },
        select: { id: true, email: true, createdAt: true },
      });
    },

    async createAdmin(input: {
      email: string;
      password: string;
    }): Promise<CreateAdminResult> {
      if (!isStrongPassword(input.password)) {
        return { ok: false, reason: "weak_password" };
      }

      const email = normalizeAdminEmail(input.email);
      const existing = await client.authAdmin.findUnique({ where: { email } });
      if (existing) return { ok: false, reason: "duplicate" };

      const admin = await client.authAdmin.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
        },
      });

      return { ok: true, admin: { id: admin.id, email: admin.email } };
    },

    async deleteAdmin(adminId: string): Promise<DeleteAdminResult> {
      const admin = await client.authAdmin.findUnique({ where: { id: adminId } });
      if (!admin) return { ok: false, reason: "not_found" };

      const count = await client.authAdmin.count();
      if (count <= 1) return { ok: false, reason: "last_admin" };

      await client.authAdmin.delete({ where: { id: adminId } });
      return { ok: true };
    },

    async setAdminPassword(adminId: string, password: string): Promise<SetAdminPasswordResult> {
      if (!isStrongPassword(password)) {
        return { ok: false, reason: "weak_password" };
      }

      const admin = await client.authAdmin.findUnique({ where: { id: adminId } });
      if (!admin) return { ok: false, reason: "not_found" };

      await client.authAdmin.update({
        where: { id: adminId },
        data: { passwordHash: await hashPassword(password) },
      });

      return { ok: true };
    },

    async createAdminPasswordResetToken(
      email: string
    ): Promise<{ token: string; email: string } | null> {
      const normalized = normalizeAdminEmail(email);
      const admin = await client.authAdmin.findUnique({ where: { email: normalized } });
      if (!admin) return null;

      await client.adminPasswordResetToken.deleteMany({
        where: { adminId: admin.id, usedAt: null },
      });

      const token = generateAdminResetToken();
      const expiresAt = new Date(Date.now() + ADMIN_RESET_TOKEN_TTL_MS);

      await client.adminPasswordResetToken.create({
        data: {
          adminId: admin.id,
          tokenHash: hashAdminResetToken(token),
          expiresAt,
        },
      });

      return { token, email: admin.email };
    },

    async resetAdminPasswordWithToken(
      token: string,
      newPassword: string
    ): Promise<ResetAdminPasswordWithTokenResult> {
      if (!isStrongPassword(newPassword)) {
        return { ok: false, reason: "weak_password" };
      }

      const trimmed = token.trim();
      if (!trimmed) return { ok: false, reason: "invalid_or_expired" };

      const row = await client.adminPasswordResetToken.findFirst({
        where: {
          tokenHash: hashAdminResetToken(trimmed),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!row) return { ok: false, reason: "invalid_or_expired" };

      await client.authAdmin.update({
        where: { id: row.adminId },
        data: { passwordHash: await hashPassword(newPassword) },
      });

      await client.adminPasswordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });

      return { ok: true };
    },

    async changeAdminPassword(
      adminId: string,
      currentPassword: string,
      newPassword: string
    ): Promise<ChangeAdminPasswordResult> {
      if (!isStrongPassword(newPassword)) {
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
