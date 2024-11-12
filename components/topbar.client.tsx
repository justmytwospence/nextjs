"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import SyncStravaButton from "@/components/sync-strava-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TopbarClient({ session }: { session: any }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/routes", label: "Routes" },
    { href: "/activities", label: "Activities" },
    { href: "/route-comparison", label: "Compare Routes" },
    { href: "/segment-sniper", label: "Segment Sniper" }
  ];

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <nav className={`${mobileMenuOpen ? "flex" : "hidden"
        } absolute left-0 right-0 top-16 flex-col gap-4 border-b bg-background p-4 md:static md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:p-0 lg:gap-6`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`whitespace-nowrap transition-colors hover:text-foreground/80 ${pathname === link.href ? "font-bold" : "text-foreground/60"
              }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {session && (
        <div className="flex items-center gap-4">
          <SyncStravaButton
            type={
              pathname.startsWith("/activities")
                ? "activities"
                : pathname.startsWith("/routes")
                  ? "routes"
                  : "all"
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image} alt="Profile" />
                  <AvatarFallback>
                    {session?.user?.name?.split(" ").map(n => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={async () => {
                await signOut({ redirectTo: "/login" });
              }}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  )
}
