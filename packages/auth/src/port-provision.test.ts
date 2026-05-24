import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password";
import { createAuthStore, type AuthStoreClient } from "./store";
import { provisionPortEverywhere, syncPortMetaEverywhere } from "./port-provision";

function mockClient(overrides?: Partial<AuthStoreClient>): AuthStoreClient {
  return {
    authPort: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    authPortCredential: {
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    authAdmin: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    adminPasswordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    reportsUser: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    manager: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    managerPortAccess: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    ...overrides,
  } as AuthStoreClient;
}

describe("provisionPortEverywhere", () => {
  it("rejects weak passwords", async () => {
    const store = createAuthStore(mockClient());
    const executeRaw = vi.fn();

    const result = await provisionPortEverywhere(store, { $executeRaw: executeRaw }, {
      code: "ntl",
      name: "Newcastle",
      password: "short",
    });

    expect(result).toEqual({ ok: false, reason: "weak_password" });
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("creates auth and ensures app port rows for a new port", async () => {
    const passwordHash = await hashPassword("password-ok");
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({
      id: "auth-1",
      code: "NTL",
      name: "Newcastle",
    });
    const upsert = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const executeRaw = vi.fn().mockResolvedValue(1);

    const store = createAuthStore(
      mockClient({
        authPort: { findFirst: vi.fn(), findUnique, create, update },
        authPortCredential: { update: vi.fn(), create: vi.fn(), upsert },
      })
    );

    const result = await provisionPortEverywhere(store, { $executeRaw: executeRaw }, {
      code: "ntl",
      name: "Newcastle",
      password: "password-ok",
    });

    expect(result).toEqual({
      ok: true,
      authPortId: "auth-1",
      code: "NTL",
      name: "Newcastle",
    });
    expect(create).toHaveBeenCalledOnce();
    expect(upsert).not.toHaveBeenCalled();
    expect(executeRaw).toHaveBeenCalledTimes(2);
  });

  it("updates password and ensures siblings when auth port already exists", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "auth-ntl",
      code: "NTL",
      name: "Old Name",
      isActive: true,
      credentials: { passwordHash: "hash" },
    });
    const upsert = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn();
    const executeRaw = vi.fn().mockResolvedValue(1);

    const store = createAuthStore(
      mockClient({
        authPort: { findFirst: vi.fn(), findUnique, create, update },
        authPortCredential: { update: vi.fn(), create: vi.fn(), upsert },
      })
    );

    const result = await provisionPortEverywhere(store, { $executeRaw: executeRaw }, {
      code: "NTL",
      name: "Newcastle",
      password: "new-password",
    });

    expect(result.ok).toBe(true);
    expect(create).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      where: { id: "auth-ntl" },
      data: { name: "Newcastle" },
    });
    expect(executeRaw).toHaveBeenCalledTimes(2);
  });
});

describe("syncPortMetaEverywhere", () => {
  it("updates sibling schemas for code and name changes", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);

    await syncPortMetaEverywhere({ $executeRaw: executeRaw }, {
      previousCode: "OLD",
      code: "NEW",
      name: "Renamed",
    });

    expect(executeRaw).toHaveBeenCalledTimes(4);
  });
});
