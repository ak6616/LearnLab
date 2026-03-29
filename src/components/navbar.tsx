"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, Menu, LayoutDashboard, BookOpen, Award, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const isInstructor = session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <GraduationCap className="h-6 w-6 text-primary" />
          LearnLab
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              {isInstructor && (
                <Link href="/instructor" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Instructor
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/dashboard" className="flex w-full items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/dashboard/certificates" className="flex w-full items-center gap-2">
                      <Award className="h-4 w-4" />Certificates
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
                Sign in
              </Link>
              <Link href="/register" className={cn(buttonVariants())}>
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 pt-8">
              <Link href="/courses" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />Courses
              </Link>
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                    <LayoutDashboard className="h-4 w-4" />Dashboard
                  </Link>
                  {isInstructor && (
                    <Link href="/instructor" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                      <UserCircle className="h-4 w-4" />Instructor
                    </Link>
                  )}
                  <Link href="/dashboard/certificates" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                    <Award className="h-4 w-4" />Certificates
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false); }}
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "ghost" }))}>
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className={cn(buttonVariants())}>
                    Get started
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
