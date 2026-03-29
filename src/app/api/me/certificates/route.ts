import { prisma } from "@/lib/db";
import {
  jsonSuccess,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

// GET /api/me/certificates — my certificates
export async function GET() {
  try {
    const session = await requireAuth();

    const certificates = await prisma.certificate.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return jsonSuccess(certificates);
  } catch (error) {
    return handleApiError(error);
  }
}
