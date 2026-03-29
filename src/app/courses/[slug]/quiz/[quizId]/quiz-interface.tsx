"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ChevronLeft, HelpCircle, RotateCcw } from "lucide-react";

interface QuizInterfaceProps {
  slug: string;
  quiz: any;
  lastAttempt: any;
}

export function QuizInterface({ slug, quiz, lastAttempt }: QuizInterfaceProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = quiz.questions;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/courses/${slug}/quizzes/${quiz.id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setCurrentQuestion(0);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader className="text-center">
            {result.passed ? (
              <>
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
                <CardTitle className="text-green-600">Congratulations!</CardTitle>
              </>
            ) : (
              <>
                <XCircle className="mx-auto mb-2 h-12 w-12 text-destructive" />
                <CardTitle className="text-destructive">Not quite</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-3xl font-bold">{result.score}%</p>
            <p className="text-muted-foreground">
              Pass mark: {quiz.passMark}%
            </p>
            <div className="flex justify-center gap-3 pt-4">
              {!result.passed && (
                <Button variant="outline" onClick={handleRetry}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Try again
                </Button>
              )}
              <Button asChild>
                <Link href={`/courses/${slug}`}>Back to course</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/courses/${slug}`} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to course
      </Link>

      <div className="mb-6">
        <Badge variant="outline" className="mb-2">
          <HelpCircle className="mr-1 h-3 w-3" /> Quiz
        </Badge>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pass mark: {quiz.passMark}% &middot; {totalQuestions} questions
        </p>
        {lastAttempt && (
          <p className="mt-1 text-sm text-muted-foreground">
            Last attempt: {lastAttempt.score}% {lastAttempt.passed ? "(passed)" : "(failed)"}
          </p>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span>{answeredCount}/{totalQuestions} answered</span>
        <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5 flex-1" />
      </div>

      <div className="space-y-6">
        {questions.map((q: any, i: number) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {i + 1}. {q.body}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              >
                {q.options.map((opt: any) => (
                  <div key={opt.id} className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted/50">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button
          onClick={handleSubmit}
          disabled={answeredCount < totalQuestions || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Submitting..." : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}
