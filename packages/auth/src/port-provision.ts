import type { AuthStore } from "./store";

export type PortProvisionTx = {
  $executeRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
};

export type ProvisionPortInput = {
  code: string;
  name: string;
  password: string;
};

export type ProvisionPortResult =
  | {
      ok: true;
      authPortId: string;
      code: string;
      name: string;
    }
  | { ok: false; reason: "weak_password" };

export type SyncPortMetaInput = {
  previousCode: string;
  code?: string;
  name?: string;
  isActive?: boolean;
};

function normalizePortCode(code: string): string {
  return code.trim().toUpperCase();
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

async function ensurePublicPort(
  tx: PortProvisionTx,
  code: string,
  name: string,
  isActive: boolean
): Promise<void> {
  await tx.$executeRaw`
    INSERT INTO public.ports (id, code, name, is_active, created_at)
    SELECT gen_random_uuid(), ${code}, ${name}, ${isActive}, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.ports WHERE code = ${code})
  `;
}

async function ensureMovementsPort(
  tx: PortProvisionTx,
  code: string,
  name: string,
  isActive: boolean
): Promise<void> {
  await tx.$executeRaw`
    INSERT INTO movements.ports (id, code, name, email_to, is_active, created_at)
    SELECT gen_random_uuid(), ${code}, ${name}, '', ${isActive}, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM movements.ports WHERE code = ${code})
  `;
}

/**
 * Ensures a port exists in porttools, public, and movements (matched by code).
 * Creates auth credentials when the auth port is new; updates password when auth already exists.
 */
export async function provisionPortEverywhere(
  store: AuthStore,
  tx: PortProvisionTx,
  input: ProvisionPortInput
): Promise<ProvisionPortResult> {
  const code = normalizePortCode(input.code);
  const name = input.name.trim();
  const password = input.password;

  if (!code || !name) {
    return { ok: false, reason: "weak_password" };
  }

  if (!isStrongPassword(password)) {
    return { ok: false, reason: "weak_password" };
  }

  const existingAuth = await store.findAuthPortByCode(code);

  let authPortId: string;

  if (existingAuth) {
    authPortId = existingAuth.id;
    await store.setPortPasswordByAuthPortId(authPortId, password);
    await store.syncAuthPortMeta(authPortId, { name });
  } else {
    const created = await store.createPortWithCredential({ code, name, password });
    authPortId = created.id;
  }

  const isActive = existingAuth?.isActive ?? true;

  await ensurePublicPort(tx, code, name, isActive);
  await ensureMovementsPort(tx, code, name, isActive);

  return { ok: true, authPortId, code, name };
}

/** Keeps public and movements port rows aligned after auth/local edits. */
export async function syncPortMetaEverywhere(
  tx: PortProvisionTx,
  input: SyncPortMetaInput
): Promise<void> {
  const previousCode = normalizePortCode(input.previousCode);
  const nextCode =
    input.code !== undefined ? normalizePortCode(input.code) : previousCode;
  const name = input.name?.trim();
  const isActive = input.isActive;

  if (name !== undefined) {
    await tx.$executeRaw`
      UPDATE public.ports
      SET name = ${name}
      WHERE code = ${previousCode}
    `;
    await tx.$executeRaw`
      UPDATE movements.ports
      SET name = ${name}
      WHERE code = ${previousCode}
    `;
  }

  if (isActive !== undefined) {
    await tx.$executeRaw`
      UPDATE public.ports
      SET is_active = ${isActive}
      WHERE code = ${previousCode}
    `;
    await tx.$executeRaw`
      UPDATE movements.ports
      SET is_active = ${isActive}
      WHERE code = ${previousCode}
    `;
  }

  if (nextCode !== previousCode) {
    await tx.$executeRaw`
      UPDATE public.ports
      SET code = ${nextCode}
      WHERE code = ${previousCode}
    `;
    await tx.$executeRaw`
      UPDATE movements.ports
      SET code = ${nextCode}
      WHERE code = ${previousCode}
    `;
  }
}

export { normalizePortCode };
