import { useAuth } from '@workos/authkit-tanstack-react-start/client'
import { LogOut } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

/** Signed-in user block for the sidebar footer: avatar and name that open a sign-out menu. */
export function UserMenu({ className }: { className?: string }) {
  const { user, role, loading } = useAuth()

  if (!user) {
    return loading ? <UserMenuSkeleton className={className} /> : null
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const roleLabel = formatRole(role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-3 rounded-full py-1 pr-3 pl-1 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=open]:bg-sidebar-accent/60',
            className,
          )}
        >
          <Avatar>
            <AvatarImage src={user.profilePictureUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
              {initialsFor(user.firstName, user.lastName, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-60 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {roleLabel ? `${roleLabel} · ${user.email}` : user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => window.location.assign('/api/auth/sign-out?returnTo=%2F')}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenuSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-1 pl-1', className)} aria-hidden>
      <div className="size-8 animate-pulse rounded-full bg-muted" />
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  )
}

function initialsFor(first: string | null, last: string | null, email: string) {
  const letters = [first, last]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase()
  return letters || email.charAt(0).toUpperCase()
}

/** WorkOS role slugs look like `admin` or `org-admin`; show them in sentence case. */
function formatRole(role: string | undefined) {
  if (!role) return undefined
  const words = role.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
