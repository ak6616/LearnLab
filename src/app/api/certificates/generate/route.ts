import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { jsonError, jsonSuccess, handleApiError } from "@/lib/api-utils";

const generateSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
});

// POST /api/certificates/generate — trigger certificate generation (internal)
export async function POST(req: NextRequest) {
  try {
    // Internal endpoint — validate via a simple shared secret or check caller
    const body = await req.json();
    const { userId, courseId } = generateSchema.parse(body);

    // Check if certificate already exists
    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
    if (existing) {
      return jsonSuccess(existing);
    }

    // Verify completion
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });
    if (!course) return jsonError("Course not found", 404);

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
    if (!enrollment) return jsonError("Not enrolled", 404);

    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    });
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        enrollmentId: enrollment.id,
        completed: true,
      },
    });

    if (completedLessons < totalLessons) {
      return jsonError("Course not fully completed", 400);
    }

    // Check quizzes
    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      select: { id: true },
    });
    for (const quiz of quizzes) {
      const passed = await prisma.quizAttempt.findFirst({
        where: { userId, quizId: quiz.id, passed: true },
      });
      if (!passed) {
        return jsonError("Not all quizzes passed", 400);
      }
    }

    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        // pdfUrl will be populated after PDF generation
        // For now, the certificate record is created with a verifyToken
      },
    });

    // TODO: Generate PDF via @react-pdf/renderer and upload to R2
    // For now, the certificate is created with just the verifyToken

    return jsonSuccess(certificate, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
