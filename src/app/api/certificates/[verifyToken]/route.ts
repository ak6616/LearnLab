import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ verifyToken: string }> };

// GET /api/certificates/[verifyToken] — public certificate verification
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { verifyToken } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { verifyToken },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });

    if (!certificate) return jsonError("Certificate not found", 404);

    return jsonSuccess({
      studentName: certificate.user.name,
      courseTitle: certificate.course.title,
      issuedAt: certificate.issuedAt,
      verified: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
