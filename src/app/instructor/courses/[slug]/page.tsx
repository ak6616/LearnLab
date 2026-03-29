export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, ChevronLeft, BookOpen } from "lucide-react";

async function getCourseAnalytics(slug: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { slug, instructorId: userId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) return null;

  const completedEnrollments = await prisma.enrollment.count({
    where: { courseId: course.id, status: "COMPLETED" },
  });

  const revenue = await prisma.payment.aggregate({
    where: { courseId: course.id, status: "SUCCEEDED" },
    _sum: { amountCents: true },
  });

  const recentEnrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { enrolledAt: "desc" },
    take: 10,
  });

  const completionRate =
    course._count.enrollments > 0
      ? Math.round((completedEnrollments / course._count.enrollments) * 100)
      : 0;

  return {
    course,
    completedEnrollments,
    completionRate,
    revenue: revenue._sum.amountCents || 0,
    recentEnrollments,
  };
}

export default async function CourseAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getCourseAnalytics(slug, session.user.id);
  if (!data) notFound();

  const { course, completedEnrollments, completionRate, revenue, recentEnrollments } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/instructor" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"} className="mt-2">
          {course.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{course._count.enrollments}</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{completedEnrollments}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">${(revenue / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEnrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{e.user.name || e.user.email}</p>
                    <p className="text-xs text-muted-foreground">{e.user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={e.status === "COMPLETED" ? "default" : "secondary"} className="text-xs">
                      {e.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(e.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
