export function isResendConfigured(): boolean {
  return !!(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()
  );
}

type SendResendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendResendEmail(
  input: SendResendEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { ok: false, error: "Email is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    return { ok: false, error: body?.message ?? "Failed to send email" };
  }

  return { ok: true };
}

export async function sendAdminPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  productName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const subject = `${input.productName} — admin password reset`;
  const text = [
    `You requested a password reset for your ${input.productName} admin account.`,
    "",
    `Reset your password using this link (valid for 1 hour):`,
    input.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  return sendResendEmail({ to: input.to, subject, text });
}
