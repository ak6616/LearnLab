export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search } from "lucide-react";
import { prisma } from "@/lib/db";

async function getCourses() {
  return prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Courses</h1>
        <p className="mt-2 text-muted-foreground">Explore our catalog and start learning today</p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">No courses yet</h2>
          <p className="mt-2 text-muted-foreground">Check back soon for new courses.</p>
        </div>
      ) : (
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
                    <Badge variant="outline" className="text-xs">
                      {course._count.enrollments} students
                    </Badge>
                  </div>
                  <h3 className="mt-2 font-semibold leading-tight">{course.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
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
      )}
    </div>
  );
}
