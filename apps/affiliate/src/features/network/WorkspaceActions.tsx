import { useConvexAuth, useQuery } from 'convex/react'
import { ArrowUpRight, Bell, MessageCircle, X } from 'lucide-react'
import { useId, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { roleOptions } from './navigation'
import type { DemoIdentity } from './types'
import { Button } from './ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'
import { workspaceAlerts } from './workspace-alerts'

export function WorkspaceActions({
  identity,
  currentPage,
  onPageChange,
  mode = 'expanded',
}: {
  identity: DemoIdentity
  currentPage: string
  onPageChange: (page: string) => void
  mode?: 'expanded' | 'collapsed' | 'mobile'
}) {
  const id = useId()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const { isAuthenticated } = useConvexAuth()
  const threads = useQuery(
    api.messages.listThreads,
    isAuthenticated ? { identityKey: identity } : 'skip',
  )
  const unread = threads?.reduce((sum, thread) => sum + thread.unread, 0)
  const alerts = workspaceAlerts(identity)
  const name = roleOptions.find((option) => option.value === identity)?.label
  const iconOnly = mode !== 'expanded'
  const badge = (count: number | undefined) =>
    count ? (
      <span className="waverly-workspace-action-count" aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
    ) : null

  return (
    <fieldset
      className={`waverly-workspace-actions waverly-workspace-actions-${mode}`}
      aria-label="Messages and alerts"
    >
      <Button
        variant="secondary"
        size={iconOnly ? 'icon' : 'default'}
        className="waverly-workspace-action"
        aria-label="Messages"
        aria-describedby={`${id}-messages`}
        aria-current={currentPage === 'Messages' ? 'page' : undefined}
        title="Messages"
        onClick={() => onPageChange('Messages')}
      >
        <MessageCircle aria-hidden />
        {!iconOnly ? <span>Messages</span> : null}
        {badge(unread)}
      </Button>
      <span id={`${id}-messages`} className="sr-only">
        {unread === undefined ? 'Loading unread count' : `${unread} unread messages`}
      </span>
      <Popover open={alertsOpen} onOpenChange={setAlertsOpen}>
        <PopoverTrigger
          render={<Button variant="secondary" size={iconOnly ? 'icon' : 'default'} />}
          className="waverly-workspace-action"
          aria-label="Alerts"
          aria-describedby={`${id}-alerts`}
          title="Alerts"
        >
          <Bell aria-hidden />
          {!iconOnly ? <span>Alerts</span> : null}
          {badge(alerts.length)}
        </PopoverTrigger>
        <span id={`${id}-alerts`} className="sr-only">
          {alerts.length} workspace alerts
        </span>
        <PopoverContent
          side={mode === 'mobile' ? 'bottom' : 'top'}
          align={mode === 'mobile' ? 'end' : 'start'}
          sideOffset={10}
          data-workspace-theme="compact"
          className="waverly-alerts-popup w-[min(352px,calc(100vw-24px))] gap-0 p-0"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <PopoverTitle>Alerts</PopoverTitle>
              <PopoverDescription className="mt-1 text-xs">
                {name} · Sample workspace updates
              </PopoverDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close alerts"
              onClick={() => setAlertsOpen(false)}
            >
              <X aria-hidden />
            </Button>
          </div>
          {alerts.length ? (
            <ul
              className="max-h-[min(360px,55svh)] overflow-y-auto p-1.5"
              aria-label="Workspace alerts"
            >
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    className="waverly-alert-item"
                    onClick={() => {
                      setAlertsOpen(false)
                      onPageChange(alert.page)
                    }}
                  >
                    <span>
                      <strong>{alert.title}</strong>
                      <span>{alert.detail}</span>
                      <small>View {alert.page.toLowerCase()}</small>
                    </span>
                    <ArrowUpRight size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          )}
        </PopoverContent>
      </Popover>
    </fieldset>
  )
}
