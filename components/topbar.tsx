import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth, signOut } from "@/auth"
import SyncStravaButton from "@/components/sync-strava-button"
import NavLinks from "./topbar.client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function Topbar() {
  const session = await auth();

  const links = [
    { href: '/routes', label: 'Routes' },
    { href: '/route-comparison', label: 'Compare Routes' },
    { href: '/segment-sniper', label: 'Segment Sniper' }
  ];

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-semibold md:flex md:flex-row md:items-center md:gap-5 md:text-base lg:gap-6">
        <NavLinks links={links} />
      </nav>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image} alt="Profile" />
                <AvatarFallback>
                  {session?.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={async () => {
              'use server';
              await signOut();
            }}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {session && <SyncStravaButton />}
    </header >
  )
}
