export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { LessonPlayer } from "./lesson-player";

async function getLessonData(slug: string, lessonId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      quizzes: { select: { id: true, title: true, moduleId: true } },
    },
  });

  if (!course) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });

  if (!enrollment) return null;

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson) return null;

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const progress = await prisma.lessonProgress.findMany({
    where: { enrollmentId: enrollment.id },
    select: { lessonId: true, completed: true },
  });

  const progressMap = Object.fromEntries(progress.map((p) => [p.lessonId, p.completed]));

  return {
    course,
    enrollment,
    currentLesson,
    allLessons,
    prevLesson,
    nextLesson,
    progressMap,
    quizzes: course.quizzes,
  };
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/courses/${slug}/learn/${lessonId}`);

  const data = await getLessonData(slug, lessonId, session.user.id);
  if (!data) notFound();

  return (
    <LessonPlayer
      slug={slug}
      course={data.course}
      currentLesson={data.currentLesson}
      allLessons={data.allLessons}
      prevLesson={data.prevLesson}
      nextLesson={data.nextLesson}
      progressMap={data.progressMap}
      quizzes={data.quizzes}
    />
  );
}
