import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = {
  params: Promise<{ slug: string; moduleId: string; lessonId: string }>;
};

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  kind: z.enum(["VIDEO", "TEXT", "QUIZ"]).optional(),
  muxAssetId: z.string().nullable().optional(),
  muxPlaybackId: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
});

// PATCH /api/courses/[slug]/modules/[moduleId]/lessons/[lessonId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug, moduleId, lessonId } = await params;
    const body = await req.json();
    const data = updateLessonSchema.parse(body);

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, moduleId, module: { courseId: course.id } },
    });
    if (!lesson) return jsonError("Lesson not found", 404);

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });

    return jsonSuccess(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
