"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`whitespace-nowrap transition-colors hover:text-foreground/80 ${pathname === link.href ? "font-bold" : "text-foreground/60"
            }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}