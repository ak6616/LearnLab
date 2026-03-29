export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Award, Play } from "lucide-react";
import { prisma } from "@/lib/db";

async function getFeaturedCourses() {
  return prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

export default async function Home() {
  const courses = await getFeaturedCourses();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-4">Online Learning Platform</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Learn without limits
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Access world-class courses, track your progress, earn certificates, and advance your career with LearnLab.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Start learning free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: BookOpen, title: "Interactive Courses", desc: "Video lessons, quizzes, and hands-on modules designed by experts." },
              { icon: Play, title: "Learn at Your Pace", desc: "Track your progress and pick up right where you left off." },
              { icon: Award, title: "Earn Certificates", desc: "Complete courses and earn verifiable certificates to showcase your skills." },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="border-t py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Featured Courses</h2>
                <p className="mt-1 text-muted-foreground">Start learning from our latest courses</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/courses">View all</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {course._count.modules} modules
                        </Badge>
                      </div>
                      <h3 className="mt-2 font-semibold leading-tight">{course.title}</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {course.instructor?.name || "Instructor"}
                      </span>
                      <span className="font-semibold">
                        {course.price === 0 ? "Free" : `$${(course.price / 100).toFixed(2)}`}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
