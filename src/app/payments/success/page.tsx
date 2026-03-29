"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [courseSlug, setCourseSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch(`/api/payments/success?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.enrolled) {
          setCourseSlug(data.courseSlug || null);
          setStatus("success");
        } else {
          setStatus("success");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-2 h-12 w-12 animate-spin text-muted-foreground" />
              <CardTitle>Processing payment...</CardTitle>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
              <CardTitle className="text-green-600">Payment successful!</CardTitle>
            </>
          )}
          {status === "error" && (
            <CardTitle>Payment status</CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-muted-foreground">
                You&apos;re now enrolled. Start learning right away!
              </p>
              <div className="flex justify-center gap-3">
                {courseSlug && (
                  <Button asChild>
                    <Link href={`/courses/${courseSlug}`}>Go to course</Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-muted-foreground">
                We couldn&apos;t verify your payment. If you were charged, your enrollment will be processed shortly.
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
