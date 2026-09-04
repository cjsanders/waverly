import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useAuth } from '@workos/authkit-tanstack-react-start/client'
import { Badge } from '@waverly/design-system/ui/badge'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import { homePaths, kindLabels, type Membership, type Viewer } from '#/lib/workspace'

/** Sidebar control showing the active workspace and letting the user switch between theirs. */
export function WorkspaceSwitcher({
  viewer,
  workspace,
  className,
}: {
  viewer: Viewer
  workspace: Membership
  className?: string
}) {
  const { switchToOrganization } = useAuth()
  const router = useRouter()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function select(membership: Membership) {
    if (membership._id === workspace._id) return
    setPending(true)

    try {
      const result = await switchToOrganization(membership.organization.workosOrganizationId)
      if (result && 'error' in result) throw new Error(result.error)

      await router.invalidate()
      await navigate({ to: homePaths[membership.organization.kind] })
    } catch (error) {
      console.error('Failed to switch workspace', error)
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-60 data-[state=open]:bg-sidebar-accent/60',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {workspace.organization.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {kindLabels[workspace.organization.kind]} workspace
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-64 rounded-xl">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Your workspaces
        </DropdownMenuLabel>
        {viewer.memberships.map((membership) => {
          const active = membership._id === workspace._id
          return (
            <DropdownMenuItem
              key={membership._id}
              onSelect={() => void select(membership)}
              className="gap-3"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{membership.organization.name}</span>
                <span className="text-xs text-muted-foreground">
                  {kindLabels[membership.organization.kind]} · {formatRole(membership.role)}
                </span>
              </span>
              {active ? (
                <Check className="size-4" aria-label="Current workspace" />
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {kindLabels[membership.organization.kind]}
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/onboarding">
            <Plus />
            New workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatRole(role: string) {
  const words = role.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
