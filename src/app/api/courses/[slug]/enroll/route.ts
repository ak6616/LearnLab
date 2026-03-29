import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

// POST /api/courses/[slug]/enroll — enroll in free course
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, status: true, price: true },
    });
    if (!course) return jsonError("Course not found", 404);
    if (course.status !== "PUBLISHED")
      return jsonError("Course not available", 400);
    if (course.price > 0)
      return jsonError(
        "This is a paid course. Use the payment checkout flow.",
        400
      );

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    if (existing) return jsonError("Already enrolled", 409);

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
      },
    });

    return jsonSuccess(enrollment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
