"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";

// Add this new component at the bottom of the file
export default function NavLinks({ links }) {
  const pathname = usePathname();

  return (
    <>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`transition-colors hover:text-foreground whitespace-nowrap ${pathname === link.href
            ? 'text-foreground font-medium'
            : 'text-muted-foreground'
            }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}