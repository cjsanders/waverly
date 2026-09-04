import { Card, CardDescription, CardHeader, CardTitle } from '@waverly/design-system/ui/card'
import type { ReactNode } from 'react'

export function EmptyOverview({ children }: { children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="items-center py-16 text-center">
        <CardTitle className="text-2xl">Nothing to show yet</CardTitle>
        <CardDescription className="mt-1 max-w-md text-base">{children}</CardDescription>
      </CardHeader>
    </Card>
  )
}
