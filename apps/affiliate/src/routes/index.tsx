import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="page-wrap grid min-h-screen place-items-center py-16">
      <section className="island-shell max-w-2xl rounded-3xl p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--kicker)]">
          Waverly
        </p>
        <h1 className="display-title mt-4 text-5xl font-bold">Affiliate network workspace</h1>
        <p className="mt-5 text-lg text-[var(--sea-ink-soft)]">
          TanStack Start, Convex, WorkOS, Tinybird, and TanStack Charts are ready for product
          development.
        </p>
        <Button asChild className="mt-8">
          <a href="/api/auth/sign-in">Sign in with WorkOS</a>
        </Button>
      </section>
    </main>
  )
}
