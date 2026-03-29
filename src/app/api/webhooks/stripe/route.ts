import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

// Disable Next.js body parser for raw body access
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const courseId = session.metadata?.courseId;

      if (!userId || !courseId) break;

      // Idempotency: check if already processed
      const existingPayment = await prisma.payment.findUnique({
        where: { stripeSessionId: session.id },
      });
      if (existingPayment?.status === "SUCCEEDED") break;

      // Update payment and create enrollment in a transaction
      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: "SUCCEEDED",
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          },
        }),
        prisma.enrollment.upsert({
          where: {
            userId_courseId: { userId, courseId },
          },
          create: { userId, courseId },
          update: {},
        }),
      ]);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "FAILED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
