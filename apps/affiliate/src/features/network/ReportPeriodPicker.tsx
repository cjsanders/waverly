import { CalendarDays, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from './ui/popover'
import type { DateRange } from './ui/primitives'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export function ReportPeriodPicker({
  value,
  onChange,
  presets,
  min,
  max,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  presets: Array<{ label: string; getRange: () => DateRange }>
  min: string
  max: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const reversed = Boolean(draft.start && draft.end && draft.start > draft.end)
  const valid = Boolean(
    draft.start && draft.end && !reversed && draft.start >= min && draft.end <= max,
  )
  const dateLabel = dateFormatter.formatRange(
    new Date(`${value.start}T00:00:00Z`),
    new Date(`${value.end}T00:00:00Z`),
  )
  const apply = (range: DateRange) => {
    onChange(range)
    setOpen(false)
  }

  return (
    <div className="waverly-field">
      <span id={`${id}-label`}>Report period</span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(value)
          setOpen(next)
        }}
      >
        <PopoverTrigger
          render={<Button variant="secondary" />}
          className="w-full justify-between font-normal"
          aria-labelledby={`${id}-label ${id}-value`}
        >
          <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
          <span id={`${id}-value`}>{dateLabel}</span>
          <ChevronDown aria-hidden className="ml-auto size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="waverly-report-period-popup w-[min(352px,calc(100vw-32px))] gap-3 p-4"
          data-workspace-theme="compact"
        >
          <PopoverTitle>Report period</PopoverTitle>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const range = preset.getRange()
              const selected = range.start === value.start && range.end === value.end
              return (
                <Button
                  key={preset.label}
                  variant={selected ? 'default' : 'secondary'}
                  aria-pressed={selected}
                  onClick={() => apply(range)}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
          <form
            className="flex flex-col gap-3 border-t border-border pt-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (valid) apply(draft)
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="waverly-field" htmlFor={`${id}-from`}>
                From
                <Input
                  id={`${id}-from`}
                  type="date"
                  required
                  className="min-w-0 px-2"
                  value={draft.start}
                  min={min}
                  max={max}
                  onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                />
              </label>
              <label className="waverly-field" htmlFor={`${id}-to`}>
                To
                <Input
                  id={`${id}-to`}
                  type="date"
                  required
                  className="min-w-0 px-2"
                  value={draft.end}
                  min={min}
                  max={max}
                  aria-invalid={reversed || undefined}
                  aria-describedby={reversed ? `${id}-error` : undefined}
                  onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                />
              </label>
            </div>
            {reversed ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
                End date must be on or after the start date.
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!valid}>
                Apply dates
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}
