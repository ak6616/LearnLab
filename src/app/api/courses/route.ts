import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  jsonError,
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

// GET /api/courses — list published courses (paginated, public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          price: true,
          currency: true,
          instructor: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { enrollments: true, modules: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
    ]);

    return jsonSuccess({ courses, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price: z.number().int().min(0),
  currency: z.string().default("usd"),
  thumbnailUrl: z.string().url().optional(),
});

// POST /api/courses — create course (INSTRUCTOR only)
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");
    const body = await req.json();
    const data = createCourseSchema.parse(body);

    const existing = await prisma.course.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return jsonError("Slug already taken", 409);
    }

    const course = await prisma.course.create({
      data: {
        ...data,
        instructorId: session.user.id,
      },
    });

    return jsonSuccess(course, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0].message, 400);
    }
    return handleApiError(error);
  }
}
