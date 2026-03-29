"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Clock, Users, Play, FileText, HelpCircle, CheckCircle } from "lucide-react";

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface CourseDetailProps {
  course: any;
  enrollment: any;
  session: any;
  totalLessons: number;
  totalDuration: number;
}

export function CourseDetail({ course, enrollment, session, totalLessons, totalDuration }: CourseDetailProps) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);

  const isEnrolled = !!enrollment;
  const isFree = course.price === 0;

  async function handleEnroll() {
    if (!session) {
      router.push(`/login?callbackUrl=/courses/${course.slug}`);
      return;
    }

    setEnrolling(true);

    if (isFree) {
      const res = await fetch(`/api/courses/${course.slug}/enroll`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } else {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }
    setEnrolling(false);
  }

  const firstLesson = course.modules[0]?.lessons[0];

  const lessonIcon = (kind: string) => {
    switch (kind) {
      case "VIDEO": return <Play className="h-4 w-4" />;
      case "QUIZ": return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Badge variant="secondary" className="mb-3">Course</Badge>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{course.description}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDuration(totalDuration)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {course._count.enrollments} students
            </span>
          </div>

          <Separator className="my-8" />

          {/* Curriculum */}
          <h2 className="mb-4 text-xl font-semibold">Curriculum</h2>
          <div className="space-y-4">
            {course.modules.map((mod: any, i: number) => (
              <Card key={mod.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Module {i + 1}: {mod.title}
                  </CardTitle>
                  {mod.description && (
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {mod.lessons.map((lesson: any) => (
                      <li key={lesson.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50">
                        <span className="flex items-center gap-2">
                          {lessonIcon(lesson.kind)}
                          {lesson.title}
                        </span>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="mb-4 text-center">
                <span className="text-3xl font-bold">
                  {isFree ? "Free" : `$${(course.price / 100).toFixed(2)}`}
                </span>
              </div>

              {isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Enrolled
                  </div>
                  {firstLesson && (
                    <Button className="w-full" asChild>
                      <Link href={`/courses/${course.slug}/learn/${firstLesson.id}`}>
                        Continue learning
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Button className="w-full" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? "Processing..." : isFree ? "Enroll for free" : "Buy this course"}
                </Button>
              )}

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-medium">{course.instructor?.name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="font-medium">{course.modules.length}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Lessons</span>
                  <span className="font-medium">{totalLessons}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Certificate</span>
                  <span className="font-medium">Yes</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
