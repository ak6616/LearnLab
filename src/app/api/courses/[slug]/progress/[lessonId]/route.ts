import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string; lessonId: string }> };

const progressSchema = z.object({
  completed: z.boolean().optional(),
  watchedSecs: z.number().int().min(0).optional(),
});

// POST /api/courses/[slug]/progress/[lessonId] — mark lesson complete / update progress
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug, lessonId } = await params;
    const body = await req.json();
    const data = progressSchema.parse(body);

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

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, module: { courseId: course.id } },
    });
    if (!lesson) return jsonError("Lesson not found", 404);

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      create: {
        userId: session.user.id,
        lessonId,
        enrollmentId: enrollment.id,
        completed: data.completed ?? false,
        watchedSecs: data.watchedSecs ?? 0,
        completedAt: data.completed ? new Date() : null,
      },
      update: {
        completed: data.completed ?? undefined,
        watchedSecs: data.watchedSecs ?? undefined,
        completedAt: data.completed ? new Date() : undefined,
      },
    });

    // Check if all lessons are complete for certificate generation
    if (data.completed) {
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

      if (completedLessons >= totalLessons) {
        // Check if all quizzes are passed
        const quizzes = await prisma.quiz.findMany({
          where: { courseId: course.id },
          select: { id: true, passMark: true },
        });

        let allQuizzesPassed = true;
        for (const quiz of quizzes) {
          const bestAttempt = await prisma.quizAttempt.findFirst({
            where: {
              userId: session.user.id,
              quizId: quiz.id,
              passed: true,
            },
          });
          if (!bestAttempt) {
            allQuizzesPassed = false;
            break;
          }
        }

        if (allQuizzesPassed) {
          // Auto-generate certificate if not already issued
          const existingCert = await prisma.certificate.findUnique({
            where: {
              userId_courseId: {
                userId: session.user.id,
                courseId: course.id,
              },
            },
          });

          if (!existingCert) {
            await prisma.certificate.create({
              data: {
                userId: session.user.id,
                courseId: course.id,
              },
            });
          }

          // Mark enrollment as completed
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
        }
      }
    }

    return jsonSuccess(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
