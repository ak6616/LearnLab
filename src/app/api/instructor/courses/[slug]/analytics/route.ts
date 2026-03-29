import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  jsonError,
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

// GET /api/instructor/courses/[slug]/analytics — enrollment + completion stats
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, instructorId: true, title: true },
    });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    const [
      totalEnrollments,
      completedEnrollments,
      totalRevenue,
      totalLessons,
      recentEnrollments,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: course.id } }),
      prisma.enrollment.count({
        where: { courseId: course.id, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({
        where: { courseId: course.id, status: "SUCCEEDED" },
        _sum: { amountCents: true },
      }),
      prisma.lesson.count({
        where: { module: { courseId: course.id } },
      }),
      prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { enrolledAt: "desc" },
        take: 10,
      }),
    ]);

    return jsonSuccess({
      courseTitle: course.title,
      totalEnrollments,
      completedEnrollments,
      completionRate:
        totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0,
      totalRevenueCents: totalRevenue._sum.amountCents || 0,
      totalLessons,
      recentEnrollments,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
