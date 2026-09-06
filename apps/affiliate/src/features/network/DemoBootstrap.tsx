import { Button } from '@waverly/design-system/ui/button'
import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'

export function DemoBootstrap() {
  const { isAuthenticated } = useConvexAuth()
  const initialize = useMutation(api.demo.initialize)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    void initialize({})
      .then(() => {
        if (active) setError(null)
        return null
      })
      .catch(() => {
        if (active)
          setError('The shared demo could not connect. You can still explore the sample catalog.')
      })
    return () => {
      active = false
    }
  }, [initialize, isAuthenticated])
  return error ? (
    <div
      role="alert"
      className="flex items-center gap-2 border-b border-border bg-card p-3 text-sm"
    >
      {error}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          void initialize({}).then(
            () => {
              setError(null)
              return null
            },
            () => null,
          )
        }}
      >
        Retry connection
      </Button>
    </div>
  ) : null
}
