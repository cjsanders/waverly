import { Link } from '@tanstack/react-router'
import { Logo } from '@waverly/design-system/brand'
import { Button } from '@waverly/design-system/ui/button'
import { Input } from '@waverly/design-system/ui/input'
import {
  Bell,
  ChartColumn,
  Globe,
  House,
  Link2,
  Megaphone,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { UserMenu } from '#/components/user-menu'
import { cn } from '#/lib/utils'

type NavItem = {
  label: string
  icon: LucideIcon
  /** Omit while the page does not exist yet; the item renders disabled. */
  to?: '/dashboard'
}

const primaryNav: NavItem[] = [
  { label: 'Overview', icon: House, to: '/dashboard' },
  { label: 'Campaigns', icon: Megaphone },
  { label: 'Creators', icon: Users },
  { label: 'Links', icon: Link2 },
  { label: 'Payouts', icon: Wallet },
  { label: 'Reports', icon: ChartColumn },
]

const secondaryNav: NavItem[] = [{ label: 'Settings', icon: Settings }]

/** Signed-in layout: fixed sidebar with navigation and the user menu, a top bar, and a content area. */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6">
        <Link to="/dashboard" className="mb-8 flex items-center px-2" aria-label="Overview">
          <Logo height={28} />
        </Link>

        <p className="mb-3 px-4 text-[11px] font-semibold tracking-[0.14em] text-sand-500 uppercase">
          Your workspace
        </p>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {primaryNav.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
          <div className="mt-auto flex flex-col gap-1">
            {secondaryNav.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>
        </nav>

        <div className="mt-4 flex items-center gap-2 border-t border-sidebar-border pt-4">
          <UserMenu className="min-w-0 flex-1" />
          <Button variant="secondary" size="icon-sm" className="ml-auto" aria-label="Messages">
            <MessageCircle />
          </Button>
          <Button variant="secondary" size="icon-sm" aria-label="Alerts">
            <Bell />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-8">
          <h1 className="text-2xl font-semibold">{title}</h1>

          <div className="relative ml-auto hidden w-full max-w-xs md:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search creators, links..."
              aria-label="Search"
              className="h-10 border-transparent bg-muted pl-10"
            />
          </div>

          <Button variant="ghost" size="icon" aria-label="Language and region">
            <Globe className="size-5" />
          </Button>
          <Button>
            <Plus />
            New campaign
          </Button>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}

const navItemClass =
  'flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-sidebar-foreground'

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon

  if (!item.to) {
    return (
      <span
        className={cn(navItemClass, 'cursor-default text-muted-foreground')}
        aria-disabled
        title="Coming soon"
      >
        <Icon aria-hidden />
        {item.label}
      </span>
    )
  }

  // TanStack Link sets data-status="active" on the current route, so the active styles live in
  // one class list instead of competing with the base text color through activeProps.
  return (
    <Link
      to={item.to}
      className={cn(
        navItemClass,
        'text-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        'data-[status=active]:border-brand-200 data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground data-[status=active]:[&_svg]:text-sidebar-accent-foreground dark:data-[status=active]:border-brand-700',
      )}
    >
      <Icon aria-hidden />
      {item.label}
    </Link>
  )
}
