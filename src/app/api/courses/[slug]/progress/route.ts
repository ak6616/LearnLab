import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

// GET /api/courses/[slug]/progress — get learner progress
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!course) return jsonError("Course not found", 404);

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    if (!enrollment) return jsonError("Not enrolled", 403);

    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId: course.id } },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: session.user.id,
        enrollmentId: enrollment.id,
        completed: true,
      },
    });

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        enrollmentId: enrollment.id,
      },
      select: {
        lessonId: true,
        completed: true,
        watchedSecs: true,
        completedAt: true,
      },
    });

    return jsonSuccess({
      totalLessons,
      completedLessons,
      percentComplete:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      lessons: progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
