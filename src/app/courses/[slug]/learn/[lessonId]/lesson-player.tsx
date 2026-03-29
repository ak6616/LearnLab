"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  BookOpen,
} from "lucide-react";

interface LessonPlayerProps {
  slug: string;
  course: any;
  currentLesson: any;
  allLessons: any[];
  prevLesson: any;
  nextLesson: any;
  progressMap: Record<string, boolean>;
  quizzes: any[];
}

export function LessonPlayer({
  slug,
  course,
  currentLesson,
  allLessons,
  prevLesson,
  nextLesson,
  progressMap,
  quizzes,
}: LessonPlayerProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

  const completedCount = Object.values(progressMap).filter(Boolean).length;
  const progressPercent = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;
  const isCompleted = progressMap[currentLesson.id] === true;

  async function markComplete() {
    setCompleting(true);
    await fetch(`/api/courses/${slug}/progress/${currentLesson.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    router.refresh();
    setCompleting(false);
  }

  const lessonIcon = (kind: string, id: string) => {
    if (progressMap[id]) return <CheckCircle className="h-4 w-4 text-green-500" />;
    switch (kind) {
      case "VIDEO": return <Play className="h-4 w-4" />;
      case "QUIZ": return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar — lesson list */}
      <aside className="w-full border-b bg-muted/30 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="p-4">
          <Link href={`/courses/${slug}`} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to course
          </Link>
          <h2 className="font-semibold truncate">{course.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{completedCount}/{allLessons.length} completed</span>
          </div>
          <Progress value={progressPercent} className="mt-2 h-1.5" />
        </div>
        <ScrollArea className="max-h-[30vh] lg:max-h-[calc(100vh-12rem)]">
          <div className="px-2 pb-4">
            {course.modules.map((mod: any) => (
              <div key={mod.id} className="mb-3">
                <p className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
                  {mod.title}
                </p>
                {mod.lessons.map((lesson: any) => (
                  <Link
                    key={lesson.id}
                    href={`/courses/${slug}/learn/${lesson.id}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      lesson.id === currentLesson.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {lessonIcon(lesson.kind, lesson.id)}
                    <span className="truncate">{lesson.title}</span>
                  </Link>
                ))}
                {quizzes
                  .filter((q: any) => q.moduleId === mod.id)
                  .map((q: any) => (
                    <Link
                      key={q.id}
                      href={`/courses/${slug}/quiz/${q.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <HelpCircle className="h-4 w-4 text-orange-500" />
                      <span className="truncate">{q.title}</span>
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-3">{currentLesson.kind}</Badge>
          <h1 className="text-2xl font-bold">{currentLesson.title}</h1>

          {currentLesson.description && (
            <p className="mt-3 text-muted-foreground">{currentLesson.description}</p>
          )}

          {/* Video player placeholder */}
          {currentLesson.kind === "VIDEO" && (
            <Card className="mt-6">
              <CardContent className="flex aspect-video items-center justify-center bg-black/5 rounded-lg">
                {currentLesson.muxPlaybackId ? (
                  <video
                    controls
                    className="h-full w-full rounded-lg"
                    src={`https://stream.mux.com/${currentLesson.muxPlaybackId}.m3u8`}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Play className="h-12 w-12" />
                    <p className="text-sm">Video content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentLesson.kind === "TEXT" && (
            <Card className="mt-6">
              <CardContent className="prose prose-sm max-w-none p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                  <p>Text lesson content</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {prevLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${slug}/learn/${prevLesson.id}`}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isCompleted && (
                <Button onClick={markComplete} disabled={completing}>
                  {completing ? "Saving..." : "Mark as complete"}
                </Button>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Completed
                </Badge>
              )}
              {nextLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${slug}/learn/${nextLesson.id}`}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
