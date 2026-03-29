export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ExternalLink } from "lucide-react";

export default async function CertificatesPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard/certificates");

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { course: { select: { title: true, slug: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="mt-1 text-muted-foreground">Your earned course completion certificates</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Award className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No certificates yet. Complete a course to earn one!</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <CardTitle className="mt-3 text-base">{cert.course.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/certificates/${cert.verifyToken}`}>
                    <ExternalLink className="mr-1 h-3 w-3" /> View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
