export type OneTimeSecret = {
  label: string;
  value: string;
};

export async function readAdminApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.length > 0 && data.error.length <= 300) {
      return data.error;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

const PASSWORD_CHARS = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateSecurePassword(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join("");
}

export function generateNumericPin(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

export type AdminCredentialPanelProps = {
  reloadToken?: number;
  onSecretsRevealed?: (secrets: OneTimeSecret[]) => void;
};
