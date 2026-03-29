export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuizInterface } from "./quiz-interface";

async function getQuizData(slug: string, quizId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) return null;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, courseId: course.id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
    },
  });
  if (!quiz) return null;

  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { userId, quizId },
    orderBy: { completedAt: "desc" },
  });

  return { course, quiz, lastAttempt };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string; quizId: string }> }) {
  const { slug, quizId } = await params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/courses/${slug}/quiz/${quizId}`);

  const data = await getQuizData(slug, quizId, session.user.id);
  if (!data) notFound();

  return <QuizInterface slug={slug} quiz={data.quiz} lastAttempt={data.lastAttempt} />;
}
