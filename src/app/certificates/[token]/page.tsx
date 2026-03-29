export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, GraduationCap } from "lucide-react";

async function getCertificate(token: string) {
  return prisma.certificate.findUnique({
    where: { verifyToken: token },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, slug: true } },
    },
  });
}

export default async function CertificateVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cert = await getCertificate(token);
  if (!cert) notFound();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
          <Badge variant="secondary" className="mx-auto flex w-fit items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" /> Verified Certificate
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Certificate of Completion</p>
            <h1 className="mt-2 text-2xl font-bold">{cert.course.title}</h1>
          </div>

          <div className="mx-auto h-px w-24 bg-border" />

          <div>
            <p className="text-sm text-muted-foreground">Awarded to</p>
            <p className="mt-1 text-xl font-semibold">{cert.user.name || "Student"}</p>
          </div>

          <div className="mx-auto h-px w-24 bg-border" />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>Issued on {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Verification ID: {token}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
