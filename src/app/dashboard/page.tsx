export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Award, Clock, GraduationCap } from "lucide-react";

async function getDashboardData(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { select: { id: true } } },
          },
          instructor: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const enrollmentProgress = await Promise.all(
    enrollments.map(async (e) => {
      const totalLessons = e.course.modules.reduce((a, m) => a + m.lessons.length, 0);
      const completedLessons = await prisma.lessonProgress.count({
        where: { enrollmentId: e.id, completed: true },
      });
      return {
        ...e,
        totalLessons,
        completedLessons,
        percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    })
  );

  const certificates = await prisma.certificate.count({ where: { userId } });

  return { enrollments: enrollmentProgress, certificateCount: certificates };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const { enrollments, certificateCount } = await getDashboardData(session.user.id);

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {session.user.name || "Student"}</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrolled courses</p>
              <p className="text-2xl font-bold">{enrollments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedEnrollments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Certificates</p>
              <p className="text-2xl font-bold">{certificateCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active courses */}
      <h2 className="mb-4 text-xl font-semibold">In Progress</h2>
      {activeEnrollments.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No courses in progress.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeEnrollments.map((e) => {
            const firstLesson = e.course.modules[0]?.lessons[0];
            return (
              <Card key={e.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-tight">{e.course.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{e.course.instructor?.name}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {e.completedLessons}/{e.totalLessons} lessons
                    </span>
                    <span className="font-medium">{e.percent}%</span>
                  </div>
                  <Progress value={e.percent} className="h-2" />
                  {firstLesson && (
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/courses/${e.course.slug}/learn/${firstLesson.id}`}>
                        Continue learning
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed courses */}
      {completedEnrollments.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Completed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedEnrollments.map((e) => (
              <Card key={e.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base leading-tight">{e.course.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href={`/courses/${e.course.slug}`}>View course</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
