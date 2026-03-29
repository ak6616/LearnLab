import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

const checkoutSchema = z.object({
  courseId: z.string(),
});

// POST /api/payments/checkout — create Stripe Checkout Session
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { courseId } = checkoutSchema.parse(body);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return jsonError("Course not found", 404);
    if (course.status !== "PUBLISHED")
      return jsonError("Course not available", 400);
    if (course.price === 0)
      return jsonError("This course is free, use the enroll endpoint", 400);

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });
    if (existing) return jsonError("Already enrolled", 409);

    // Create or use existing Stripe Price
    let stripePriceId = course.stripePriceId;
    if (!stripePriceId) {
      const product = await getStripe().products.create({
        name: course.title,
        description: course.description.substring(0, 500),
      });
      const price = await getStripe().prices.create({
        product: product.id,
        unit_amount: course.price,
        currency: course.currency,
      });
      stripePriceId = price.id;
      await prisma.course.update({
        where: { id: courseId },
        data: { stripePriceId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/courses/${course.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${course.slug}`,
      metadata: {
        userId: session.user.id,
        courseId,
      },
      customer_email: session.user.email,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        amountCents: course.price,
        currency: course.currency,
        stripeSessionId: checkoutSession.id,
      },
    });

    return jsonSuccess({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
