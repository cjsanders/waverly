import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useAuth } from '@workos/authkit-tanstack-react-start/client'
import { Logo } from '@waverly/design-system/brand'
import { Button } from '@waverly/design-system/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@waverly/design-system/ui/card'
import { Input } from '@waverly/design-system/ui/input'
import { Megaphone, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { cn } from '#/lib/utils'
import { homePaths } from '#/lib/workspace'
import { createWorkspaceFn, type CreateWorkspaceInput } from '#/server/onboarding'

export const Route = createFileRoute('/_app/onboarding')({
  component: Onboarding,
})

const choices: {
  kind: CreateWorkspaceInput['kind']
  title: string
  description: string
  icon: typeof User
}[] = [
  {
    kind: 'creator',
    title: 'Creator',
    description: 'Share links, track sales, and get paid for what you promote.',
    icon: User,
  },
  {
    kind: 'brand',
    title: 'Brand',
    description: 'Run campaigns, recruit creators, and pay commissions.',
    icon: Megaphone,
  },
]

function Onboarding() {
  const { viewer } = Route.useRouteContext()
  const { switchToOrganization } = useAuth()
  const router = useRouter()
  const navigate = useNavigate()
  const [kind, setKind] = useState<CreateWorkspaceInput['kind']>('creator')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const created = await createWorkspaceFn({ data: { name, kind } })
      const switched = await switchToOrganization(created.workosOrganizationId)
      if (switched && 'error' in switched) throw new Error(switched.error)

      await router.invalidate()
      await navigate({ to: homePaths[created.kind] })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <main className="page-wrap flex min-h-screen flex-col items-center justify-center gap-10 py-16">
      <Logo height={32} />
      <Card className="w-full max-w-xl shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            {viewer.memberships.length ? 'Create another workspace' : 'Set up your workspace'}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            Pick how you will use Waverly. You can belong to more than one workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Workspace type</legend>
              {choices.map((choice) => {
                const Icon = choice.icon
                const selected = choice.kind === kind
                return (
                  <label
                    key={choice.kind}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors',
                      selected
                        ? 'border-brand-200 bg-sidebar-accent dark:border-brand-700'
                        : 'border-border hover:bg-muted/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={choice.kind}
                      checked={selected}
                      onChange={() => setKind(choice.kind)}
                      className="sr-only"
                    />
                    <Icon className="size-5" aria-hidden />
                    <span className="font-medium">{choice.title}</span>
                    <span className="text-sm text-muted-foreground">{choice.description}</span>
                  </label>
                )
              })}
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="workspace-name" className="text-sm font-medium">
                Workspace name
              </label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={kind === 'brand' ? 'Acme Outdoors' : 'Your name or channel'}
                minLength={2}
                maxLength={80}
                required
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={pending}>
              {pending ? 'Creating…' : 'Create workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
