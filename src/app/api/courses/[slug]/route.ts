import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

// GET /api/courses/[slug] — course detail + modules (public)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: { select: { id: true, name: true, avatarUrl: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                kind: true,
                duration: true,
                order: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) return jsonError("Course not found", 404);
    return jsonSuccess(course);
  } catch (error) {
    return handleApiError(error);
  }
}

const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().min(0).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// PATCH /api/courses/[slug] — update course (owner INSTRUCTOR)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug } = await params;
    const body = await req.json();
    const data = updateCourseSchema.parse(body);

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    const updated = await prisma.course.update({
      where: { slug },
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

// DELETE /api/courses/[slug] — archive course (owner INSTRUCTOR)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const { slug } = await params;

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) return jsonError("Course not found", 404);
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return jsonError("Forbidden", 403);
    }

    await prisma.course.update({
      where: { slug },
      data: { status: "ARCHIVED" },
    });

    return jsonSuccess({ message: "Course archived" });
  } catch (error) {
    return handleApiError(error);
  }
}
