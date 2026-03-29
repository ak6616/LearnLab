import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

// GET /api/payments/success — post-payment confirmation
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId) return jsonError("Missing session_id", 400);

    const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { course: true },
    });
    if (!payment) return jsonError("Payment not found", 404);
    if (payment.userId !== session.user.id)
      return jsonError("Forbidden", 403);

    return jsonSuccess({
      status: checkoutSession.payment_status,
      course: {
        id: payment.course.id,
        title: payment.course.title,
        slug: payment.course.slug,
      },
      enrolled: payment.status === "SUCCEEDED",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
