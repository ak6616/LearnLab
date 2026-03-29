import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string; quizId: string }> };

const attemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string(),
    })
  ),
});

// POST /api/courses/[slug]/quizzes/[quizId]/attempts — submit attempt
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug, quizId } = await params;
    const body = await req.json();
    const data = attemptSchema.parse(body);

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

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId: course.id },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
    if (!quiz) return jsonError("Quiz not found", 404);

    // Score the attempt
    let correct = 0;
    const totalQuestions = quiz.questions.length;

    for (const answer of data.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const selectedOption = question.options.find(
        (o) => o.id === answer.selectedOptionId
      );
      if (selectedOption?.isCorrect) correct++;
    }

    const score =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passMark;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId,
        score,
        passed,
        answers: data.answers,
      },
    });

    return jsonSuccess({
      ...attempt,
      correct,
      totalQuestions,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}

// GET /api/courses/[slug]/quizzes/[quizId]/attempts — my attempt history
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug, quizId } = await params;

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

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId,
      },
      orderBy: { completedAt: "desc" },
    });

    return jsonSuccess(attempts);
  } catch (error) {
    return handleApiError(error);
  }
}
