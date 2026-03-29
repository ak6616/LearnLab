export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CourseDetail } from "./course-detail";

async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      instructor: { select: { id: true, name: true, avatarUrl: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, kind: true, duration: true } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

async function getEnrollment(courseId: string, userId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const session = await auth();
  let enrollment = null;
  if (session?.user?.id) {
    enrollment = await getEnrollment(course.id, session.user.id);
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
    0
  );

  return (
    <CourseDetail
      course={course}
      enrollment={enrollment}
      session={session}
      totalLessons={totalLessons}
      totalDuration={totalDuration}
    />
  );
}
