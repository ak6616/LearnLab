import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string; moduleId: string }> };

const createLessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  kind: z.enum(["VIDEO", "TEXT", "QUIZ"]).optional().default("VIDEO"),
  muxAssetId: z.string().optional(),
  muxPlaybackId: z.string().optional(),
  duration: z.number().int().optional(),
});

// POST /api/courses/[slug]/modules/[moduleId]/lessons
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug, moduleId } = await params;
    const body = await req.json();
    const data = createLessonSchema.parse(body);

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    const module = await prisma.module.findFirst({
      where: { id: moduleId, courseId: course.id },
    });
    if (!module) return jsonError("Module not found", 404);

    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        moduleId,
      },
    });

    return jsonSuccess(lesson, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
