import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password";
import { createAuthStore, type AuthStoreClient } from "./store";

const ADMIN_ID = "admin-1";

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
      create: vi.fn(),
      update: vi.fn(),
    },
    ...overrides,
  } as AuthStoreClient;
}

describe("changeAdminPassword", () => {
  it("rejects weak new passwords", async () => {
    const client = mockClient();
    const store = createAuthStore(client);

    const result = await store.changeAdminPassword(ADMIN_ID, "old-password", "short");

    expect(result).toEqual({ ok: false, reason: "weak_password" });
    expect(client.authAdmin.findUnique).not.toHaveBeenCalled();
  });

  it("rejects incorrect current password", async () => {
    const currentPassword = "correct-password";
    const findUnique = vi.fn().mockResolvedValue({
      id: ADMIN_ID,
      email: "admin@example.com",
      passwordHash: await hashPassword(currentPassword),
    });
    const client = mockClient({
      authAdmin: { findUnique, create: vi.fn(), update: vi.fn() },
    });
    const store = createAuthStore(client);

    const result = await store.changeAdminPassword(
      ADMIN_ID,
      "wrong-password",
      "new-password-ok"
    );

    expect(result).toEqual({ ok: false, reason: "invalid_current" });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: ADMIN_ID } });
  });

  it("updates password when current password is valid", async () => {
    const currentPassword = "correct-password";
    const findUnique = vi.fn().mockResolvedValue({
      id: ADMIN_ID,
      email: "admin@example.com",
      passwordHash: await hashPassword(currentPassword),
    });
    const update = vi.fn().mockResolvedValue({});
    const client = mockClient({
      authAdmin: { findUnique, create: vi.fn(), update },
    });
    const store = createAuthStore(client);

    const result = await store.changeAdminPassword(
      ADMIN_ID,
      currentPassword,
      "new-password-ok"
    );

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      data: { passwordHash: expect.any(String) },
    });
  });
});
