import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LearnLab",
  description: "EdTech LMS Platform — Learn, teach, and grow with interactive courses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LearnLab. All rights reserved.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
