import { prisma } from "@/lib/db";
import {
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

// GET /api/me/enrollments — student enrolled courses
export async function GET() {
  try {
    const session = await requireAuth();

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Add progress info
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = await prisma.lesson.count({
          where: { module: { courseId: enrollment.courseId } },
        });
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: session.user.id,
            enrollmentId: enrollment.id,
            completed: true,
          },
        });
        return {
          ...enrollment,
          totalLessons,
          completedLessons,
          percentComplete:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0,
        };
      })
    );

    return jsonSuccess(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}
