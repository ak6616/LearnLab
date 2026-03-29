import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

// GET /api/courses/[slug]/modules — list modules + lessons (enrolled or instructor)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, instructorId: true },
    });
    if (!course) return jsonError("Course not found", 404);

    // Check access: enrolled student or instructor/admin
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

    const modules = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    return jsonSuccess(modules);
  } catch (error) {
    return handleApiError(error);
  }
}

const createModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

// POST /api/courses/[slug]/modules — add module (instructor owner)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug } = await params;
    const body = await req.json();
    const data = createModuleSchema.parse(body);

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    const module = await prisma.module.create({
      data: {
        ...data,
        courseId: course.id,
      },
    });

    return jsonSuccess(module, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
