import { prisma } from "@/lib/db";
import {
  jsonSuccess,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

// GET /api/instructor/courses — instructor course list
export async function GET() {
  try {
    const session = await requireRole("INSTRUCTOR", "ADMIN");

    const courses = await prisma.course.findMany({
      where: { instructorId: session.user.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonSuccess(courses);
  } catch (error) {
    return handleApiError(error);
  }
}
