import { useAuth } from '@workos/authkit-tanstack-react-start/client'
import { Button } from '@waverly/design-system/ui/button'

export default function WorkOSUser({ large }: { large?: boolean }) {
  const { user, loading, signOut } = useAuth()
  const size = large ? 'lg' : 'default'

  if (loading) return null

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {user.profilePictureUrl && (
            <img
              src={user.profilePictureUrl}
              alt={`Avatar of ${user.firstName} ${user.lastName}`}
              className="size-10 rounded-full"
            />
          )}
          {user.firstName} {user.lastName}
        </div>
        <Button variant="secondary" size={size} onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <Button asChild size={size}>
      <a href="/api/auth/sign-in">Sign in{large && ' with AuthKit'}</a>
    </Button>
  )
}
