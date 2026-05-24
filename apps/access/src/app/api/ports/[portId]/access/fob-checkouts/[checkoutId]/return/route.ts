import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { requireAccessRegisterPort } from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string; checkoutId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "PATCH /api/admin/ports/[portId]/access/fob-checkouts/[checkoutId]/return",
    async () => {
      const { portId, checkoutId } = await context.params;
      const auth = await requireAccessRegisterPort(portId);
      if (auth instanceof NextResponse) return auth;
      const { port: portResult } = auth;

      const body = (await parseJsonBody(request)) as { notes?: string };
      const notes = body.notes?.trim();

      const checkout = await prisma.fobCheckout.findFirst({
        where: { id: checkoutId, portId },
      });
      if (!checkout) {
        return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
      }
      if (checkout.signedInAt) {
        return NextResponse.json({ error: "FOB is already returned" }, { status: 409 });
      }

      const updated = await prisma.fobCheckout.update({
        where: { id: checkoutId },
        data: {
          signedInAt: new Date(),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      return NextResponse.json({
        checkout: {
          id: updated.id,
          signedInAt: updated.signedInAt!.toISOString(),
        },
      });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
