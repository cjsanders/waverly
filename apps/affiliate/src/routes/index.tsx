import { createFileRoute } from '@tanstack/react-router'
import { Logo } from '@waverly/design-system/brand'
import { Badge } from '@waverly/design-system/ui/badge'
import { Button } from '@waverly/design-system/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@waverly/design-system/ui/card'

export const Route = createFileRoute('/')({ component: Home })

const stack = [
  { name: 'TanStack Start', role: 'Routing and server functions' },
  { name: 'Convex', role: 'Realtime data' },
  { name: 'WorkOS', role: 'Sign in and organizations' },
  { name: 'Tinybird', role: 'Event analytics' },
] as const

function Home() {
  return (
    <main className="page-wrap flex min-h-screen flex-col items-center justify-center gap-10 py-16">
      <Logo height={32} />
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader className="items-center text-center">
          <Badge variant="accent" dot className="mb-3">
            Workspace preview
          </Badge>
          <CardTitle className="text-4xl">Affiliate network workspace</CardTitle>
          <CardDescription className="mt-2 max-w-md text-base">
            Track partners, payouts, and performance in one place. Sign in to open your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <Button asChild size="lg">
            <a href="/api/auth/sign-in">Sign in with WorkOS</a>
          </Button>
          <dl className="grid w-full grid-cols-2 gap-4 border-t border-border pt-6 text-left sm:grid-cols-4">
            {stack.map((item) => (
              <div key={item.name}>
                <dt className="font-medium">{item.name}</dt>
                <dd className="text-sm text-muted-foreground">{item.role}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </main>
  )
}
