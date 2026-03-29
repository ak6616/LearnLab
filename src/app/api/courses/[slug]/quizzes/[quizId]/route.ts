import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string; quizId: string }> };

// GET /api/courses/[slug]/quizzes/[quizId] — get quiz + questions (enrolled)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug, quizId } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, instructorId: true },
    });
    if (!course) return jsonError("Course not found", 404);

    // Check enrollment or instructor
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
      });
      if (!enrollment) return jsonError("Not enrolled", 403);
    }

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId: course.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              select: {
                id: true,
                text: true,
                // Don't expose isCorrect to students
                ...(course.instructorId === session.user.id ||
                session.user.role === "ADMIN"
                  ? { isCorrect: true }
                  : {}),
              },
            },
          },
        },
      },
    });

    if (!quiz) return jsonError("Quiz not found", 404);
    return jsonSuccess(quiz);
  } catch (error) {
    return handleApiError(error);
  }
}
