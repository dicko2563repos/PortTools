import { isValidAccessPin, normalizeAccessPin } from "./access-pin";
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
  loginEmail?: string | null;
  complianceReminderEmailsEnabled?: boolean;
  asicReminderEmailsEnabled?: boolean;
  pmsLastDayReminderEmailsEnabled?: boolean;
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
  receivePmsReports?: boolean;
};

type ManagerRow = {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt?: Date;
  portAccess?: Array<{ portId: string }>;
};

/** Minimal Prisma-shaped client for the shared auth schema. */
export type AuthStoreClient = {
  authPort: {
    findFirst(args: {
      where: { code?: string; isActive?: boolean };
      include?: { credentials: true };
    }): Promise<AuthPortRow | null>;
    findUnique(args: {
      where: { code: string } | { id: string } | { loginEmail: string };
      include?: { credentials: true };
    }): Promise<AuthPortRow | null>;
    create(args: {
      data: {
        code: string;
        name: string;
        loginEmail?: string;
        credentials: { create: { passwordHash: string } };
      };
    }): Promise<{ id: string; code: string; name: string }>;
    update(args: {
      where: { id: string };
      data: {
        code?: string;
        name?: string;
        loginEmail?: string | null;
        complianceReminderEmailsEnabled?: boolean;
        asicReminderEmailsEnabled?: boolean;
        pmsLastDayReminderEmailsEnabled?: boolean;
        isActive?: boolean;
      };
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
  authPortAccessPin: {
    findUnique(args: {
      where: { portId: string };
    }): Promise<{ portId: string; pinHash: string } | null>;
    upsert(args: {
      where: { portId: string };
      create: { portId: string; pinHash: string };
      update: { pinHash: string };
    }): Promise<unknown>;
    delete(args: { where: { portId: string } }): Promise<unknown>;
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
      data: {
        email: string;
        passwordHash: string;
        isActive?: boolean;
        receivePmsReports?: boolean;
      };
    }): Promise<{ id: string; email: string }>;
    update(args: {
      where: { id: string };
      data: {
        passwordHash?: string;
        isActive?: boolean;
        receivePmsReports?: boolean;
      };
    }): Promise<unknown>;
    findMany(args: {
      where?: { isActive?: boolean; receivePmsReports?: boolean };
      select?: { email: true };
    }): Promise<Array<{ email: string }>>;
  };
  manager: {
    findUnique(args: {
      where: { email: string } | { id: string };
      include?: { portAccess: true };
    }): Promise<ManagerRow | null>;
    findMany(args: {
      where?: { isActive?: boolean; portAccess?: { some: { portId: string } } };
      orderBy?: { email: "asc" | "desc" };
      include?: { portAccess: true };
    }): Promise<ManagerRow[]>;
    create(args: {
      data: {
        email: string;
        passwordHash: string;
        isActive?: boolean;
        portAccess?: { create: Array<{ portId: string }> };
      };
    }): Promise<{ id: string; email: string }>;
    update(args: {
      where: { id: string };
      data: { passwordHash?: string; isActive?: boolean };
    }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
  };
  managerPortAccess: {
    deleteMany(args: { where: { managerId: string } }): Promise<unknown>;
    createMany(args: {
      data: Array<{ managerId: string; portId: string }>;
      skipDuplicates?: boolean;
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
export type VerifiedPortEmailLogin = { authPortId: string; code: string; email: string };
export type VerifiedAdminLogin = { adminId: string; email: string };
export type VerifiedReportsLogin = { reportsUserId: string; email: string };
export type VerifiedManagerLogin = {
  managerId: string;
  email: string;
  authPortIds: string[];
};

export type CreateManagerResult =
  | { ok: true; manager: { id: string; email: string } }
  | { ok: false; reason: "duplicate" | "weak_password" | "no_ports" };

export type SetManagerPasswordResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "weak_password" };

function normalizePortCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeReportsEmail(email: string): string {
  return normalizeAdminEmail(email);
}

function normalizePortLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidPortLoginEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeManagerEmail(email: string): string {
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

    async verifyPortLoginByEmail(
      email: string,
      password: string
    ): Promise<VerifiedPortEmailLogin | null> {
      const normalized = normalizePortLoginEmail(email);
      if (!isValidPortLoginEmail(normalized)) return null;
      const authPort = await client.authPort.findUnique({
        where: { loginEmail: normalized },
        include: { credentials: true },
      });
      if (!authPort?.credentials || !authPort.isActive) return null;
      if (!(await verifyPassword(password, authPort.credentials.passwordHash))) return null;
      return { authPortId: authPort.id, code: authPort.code, email: normalized };
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
      receivePmsReports?: boolean;
    }): Promise<{ id: string; email: string }> {
      const email = normalizeReportsEmail(input.email);
      return client.reportsUser.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.receivePmsReports !== undefined
            ? { receivePmsReports: input.receivePmsReports }
            : {}),
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

    async setReportsUserReceivePmsReports(
      reportsUserId: string,
      receivePmsReports: boolean
    ): Promise<void> {
      await client.reportsUser.update({
        where: { id: reportsUserId },
        data: { receivePmsReports },
      });
    },

    async listPmsReportRecipientEmails(): Promise<string[]> {
      const users = await client.reportsUser.findMany({
        where: { isActive: true, receivePmsReports: true },
        select: { email: true },
      });
      return users.map((user) => user.email);
    },

    async verifyManagerLogin(
      email: string,
      password: string
    ): Promise<VerifiedManagerLogin | null> {
      if (!client.manager) return null;
      const normalized = normalizeManagerEmail(email);
      const manager = await client.manager.findUnique({
        where: { email: normalized },
        include: { portAccess: true },
      });
      if (!manager || !manager.isActive) return null;
      if (!(await verifyPassword(password, manager.passwordHash))) return null;
      const authPortIds = (manager.portAccess ?? []).map((row) => row.portId);
      if (authPortIds.length === 0) return null;
      return { managerId: manager.id, email: manager.email, authPortIds };
    },

    async verifyManagerLoginForPortEmail(
      portLoginEmail: string,
      password: string
    ): Promise<VerifiedManagerLogin | null> {
      if (!client.manager) return null;
      const normalized = normalizePortLoginEmail(portLoginEmail);
      if (!isValidPortLoginEmail(normalized)) return null;

      const authPort = await client.authPort.findUnique({
        where: { loginEmail: normalized },
      });
      if (!authPort?.isActive) return null;

      const managers = await client.manager.findMany({
        where: { isActive: true, portAccess: { some: { portId: authPort.id } } },
        include: { portAccess: true },
      });
      if (managers.length === 0) return null;

      const preferred = managers.find((row) => row.email === normalized);
      const candidates = preferred ? [preferred] : managers;

      for (const manager of candidates) {
        if (!(await verifyPassword(password, manager.passwordHash))) continue;
        const authPortIds = (manager.portAccess ?? []).map((row) => row.portId);
        if (authPortIds.length === 0) continue;
        return { managerId: manager.id, email: manager.email, authPortIds };
      }

      return null;
    },

    async getAuthPortById(authPortId: string): Promise<{
      id: string;
      code: string;
      loginEmail: string | null;
      isActive: boolean;
    } | null> {
      const row = await client.authPort.findUnique({
        where: { id: authPortId },
      });
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        loginEmail: row.loginEmail ?? null,
        isActive: row.isActive,
      };
    },

    async listManagers(): Promise<
      Array<{
        id: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        authPortIds: string[];
      }>
    > {
      const rows = await client.manager.findMany({
        orderBy: { email: "asc" },
        include: { portAccess: true },
      });
      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        isActive: row.isActive,
        createdAt: row.createdAt ?? new Date(0),
        authPortIds: (row.portAccess ?? []).map((access) => access.portId),
      }));
    },

    async createManager(input: {
      email: string;
      password: string;
      authPortIds: string[];
      isActive?: boolean;
    }): Promise<CreateManagerResult> {
      if (!isStrongPassword(input.password)) {
        return { ok: false, reason: "weak_password" };
      }

      const authPortIds = [...new Set(input.authPortIds)];
      if (authPortIds.length === 0) {
        return { ok: false, reason: "no_ports" };
      }

      const email = normalizeManagerEmail(input.email);
      const existing = await client.manager.findUnique({ where: { email } });
      if (existing) return { ok: false, reason: "duplicate" };

      const manager = await client.manager.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          portAccess: {
            create: authPortIds.map((portId) => ({ portId })),
          },
        },
      });

      return { ok: true, manager: { id: manager.id, email: manager.email } };
    },

    async setManagerPassword(
      managerId: string,
      password: string
    ): Promise<SetManagerPasswordResult> {
      if (!isStrongPassword(password)) {
        return { ok: false, reason: "weak_password" };
      }

      const manager = await client.manager.findUnique({ where: { id: managerId } });
      if (!manager) return { ok: false, reason: "not_found" };

      await client.manager.update({
        where: { id: managerId },
        data: { passwordHash: await hashPassword(password) },
      });

      return { ok: true };
    },

    async setManagerActive(managerId: string, isActive: boolean): Promise<boolean> {
      const manager = await client.manager.findUnique({ where: { id: managerId } });
      if (!manager) return false;
      await client.manager.update({
        where: { id: managerId },
        data: { isActive },
      });
      return true;
    },

    async setManagerPorts(managerId: string, authPortIds: string[]): Promise<boolean> {
      const manager = await client.manager.findUnique({ where: { id: managerId } });
      if (!manager) return false;

      const uniquePortIds = [...new Set(authPortIds)];
      if (uniquePortIds.length === 0) return false;

      await client.managerPortAccess.deleteMany({ where: { managerId } });
      await client.managerPortAccess.createMany({
        data: uniquePortIds.map((portId) => ({ managerId, portId })),
        skipDuplicates: true,
      });
      return true;
    },

    async deleteManager(managerId: string): Promise<boolean> {
      const manager = await client.manager.findUnique({ where: { id: managerId } });
      if (!manager) return false;
      await client.manager.delete({ where: { id: managerId } });
      return true;
    },

    async createPortWithCredential(input: {
      code: string;
      name: string;
      password: string;
      loginEmail?: string;
    }): Promise<{ id: string; code: string; name: string }> {
      const code = normalizePortCode(input.code);
      const name = input.name.trim();
      const loginEmail = input.loginEmail
        ? normalizePortLoginEmail(input.loginEmail)
        : undefined;
      if (loginEmail && !isValidPortLoginEmail(loginEmail)) {
        throw new Error("INVALID_LOGIN_EMAIL");
      }
      return client.authPort.create({
        data: {
          code,
          name,
          ...(loginEmail ? { loginEmail } : {}),
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

    async setAccessPin(authPortId: string, pin: string): Promise<boolean> {
      const normalized = normalizeAccessPin(pin);
      if (!isValidAccessPin(normalized)) return false;
      const pinHash = await hashPassword(normalized);
      await client.authPortAccessPin.upsert({
        where: { portId: authPortId },
        create: { portId: authPortId, pinHash },
        update: { pinHash },
      });
      return true;
    },

    async verifyAccessPin(authPortId: string, pin: string): Promise<boolean> {
      const normalized = normalizeAccessPin(pin);
      if (!isValidAccessPin(normalized)) return false;
      const row = await client.authPortAccessPin.findUnique({
        where: { portId: authPortId },
      });
      if (!row) return false;
      return verifyPassword(normalized, row.pinHash);
    },

    async hasAccessPin(authPortId: string): Promise<boolean> {
      const row = await client.authPortAccessPin.findUnique({
        where: { portId: authPortId },
      });
      return row !== null;
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
      data: {
        code?: string;
        name?: string;
        loginEmail?: string | null;
        isActive?: boolean;
      }
    ): Promise<void> {
      let loginEmail: string | null | undefined = data.loginEmail;
      if (loginEmail !== undefined && loginEmail !== null) {
        loginEmail = normalizePortLoginEmail(loginEmail);
        if (!isValidPortLoginEmail(loginEmail)) {
          throw new Error("INVALID_LOGIN_EMAIL");
        }
      }
      await client.authPort.update({
        where: { id: authPortId },
        data: {
          ...(data.code !== undefined ? { code: normalizePortCode(data.code) } : {}),
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(loginEmail !== undefined ? { loginEmail } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    },

    async setPortReminderSettings(
      authPortId: string,
      data: {
        complianceReminderEmailsEnabled?: boolean;
        asicReminderEmailsEnabled?: boolean;
        pmsLastDayReminderEmailsEnabled?: boolean;
      }
    ): Promise<boolean> {
      const existing = await client.authPort.findUnique({ where: { id: authPortId } });
      if (!existing) return false;
      await client.authPort.update({
        where: { id: authPortId },
        data: {
          ...(data.complianceReminderEmailsEnabled !== undefined
            ? { complianceReminderEmailsEnabled: data.complianceReminderEmailsEnabled }
            : {}),
          ...(data.asicReminderEmailsEnabled !== undefined
            ? { asicReminderEmailsEnabled: data.asicReminderEmailsEnabled }
            : {}),
          ...(data.pmsLastDayReminderEmailsEnabled !== undefined
            ? { pmsLastDayReminderEmailsEnabled: data.pmsLastDayReminderEmailsEnabled }
            : {}),
        },
      });
      return true;
    },

    async getPortReminderSettings(authPortId: string): Promise<{
      complianceReminderEmailsEnabled: boolean;
      asicReminderEmailsEnabled: boolean;
      pmsLastDayReminderEmailsEnabled: boolean;
      loginEmail: string | null;
    } | null> {
      const row = await client.authPort.findUnique({
        where: { id: authPortId },
      });
      if (!row) return null;
      return {
        complianceReminderEmailsEnabled: Boolean(row.complianceReminderEmailsEnabled),
        asicReminderEmailsEnabled: Boolean(row.asicReminderEmailsEnabled),
        pmsLastDayReminderEmailsEnabled:
          row.pmsLastDayReminderEmailsEnabled !== undefined
            ? Boolean(row.pmsLastDayReminderEmailsEnabled)
            : true,
        loginEmail: row.loginEmail ?? null,
      };
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
