import { areaY, crosshair, defineChart, dot, lineY } from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { curveMonotoneX } from 'd3-shape'
import { useId, useMemo } from 'react'

export type PerformanceSeries = {
  name: string
  /** One value per day, oldest first. Money is in whole dollars. */
  values: number[]
}

const smooth = d3Curve(curveMonotoneX)
/** Sunset accent and comparison slate, mirrored from styles.css; gradient stops and tooltip
    swatches need literal colors. */
const sunset = '#f26b4f'
const compare = '#9fb0c0'

const dayLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const DAY_MS = 24 * 60 * 60 * 1000

type Row = { day: number; amount: number; series: string }

/**
 * Daily chart for the selected overview metric. The current period is a smooth sunset line over a
 * fading fill with the latest day marked; the comparison period sits behind it as a thin dashed
 * slate line. Areas pull the axis to zero, so the fill never exaggerates a change.
 */
export function PerformanceChart({
  current,
  previous,
  dates,
  format,
  ariaLabel,
}: {
  current: PerformanceSeries
  previous?: PerformanceSeries
  /** Timestamps for the current period, one per value, used for the day axis labels. */
  dates: number[]
  format: 'money' | 'count'
  ariaLabel: string
}) {
  const fillId = `performance-fill-${useId().replace(/[^\w-]/g, '')}`
  const definition = useMemo(() => {
    const toRows = (series: PerformanceSeries): Row[] =>
      series.values.map((amount, index) => ({ day: index + 1, amount, series: series.name }))
    const currentRows = toRows(current)
    const previousRows = previous ? toRows(previous) : []
    const latest = currentRows[currentRows.length - 1]
    const formatValue = (value: unknown) =>
      format === 'money'
        ? `$${Math.round(Number(value)).toLocaleString()}`
        : Math.round(Number(value)).toLocaleString()
    const formatDay = (value: unknown) => {
      const timestamp = dates[Math.round(Number(value)) - 1]
      return timestamp === undefined ? '' : dayLabel.format(timestamp)
    }
    const formatExact = (value: number) =>
      format === 'money'
        ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : value.toLocaleString('en-US', { maximumFractionDigits: 2 })

    return defineChart({
      marks: [
        crosshair({ x: true, y: false }),
        areaY(currentRows, {
          x: 'day',
          y: 'amount',
          z: 'series',
          fill: `url(#${fillId})`,
          curve: smooth,
        }),
        ...(previousRows.length
          ? [
              lineY(previousRows, {
                x: 'day',
                y: 'amount',
                z: 'series',
                stroke: 'var(--chart-compare)',
                strokeWidth: 1.5,
                strokeDasharray: '4 4',
                curve: smooth,
              }),
            ]
          : []),
        lineY(currentRows, {
          x: 'day',
          y: 'amount',
          z: 'series',
          stroke: 'var(--sunset)',
          strokeWidth: 2.5,
          curve: smooth,
        }),
        ...(latest
          ? [
              dot([latest], {
                x: 'day',
                y: 'amount',
                z: 'series',
                r: 4.5,
                fill: 'var(--sunset)',
                stroke: 'var(--card)',
                strokeWidth: 2,
              }),
            ]
          : []),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          axis: { ticks: { count: 6, format: formatDay } },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { ticks: { count: 4, format: formatValue } },
        },
      },
      gradients: [
        {
          id: fillId,
          x1: 0,
          y1: 1,
          x2: 0,
          y2: 0,
          stops: [
            { offset: 0, color: sunset, opacity: 0.02 },
            { offset: 1, color: sunset, opacity: 0.32 },
          ],
        },
      ],
      theme: {
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        grid: 'var(--color-border)',
        background: 'transparent',
      },
      // One tooltip per day: the date as the title, then a row for each period at that day.
      focus: 'group-x',
      tooltip: {
        use: tooltip,
        content(points) {
          const seen = new Set<string>()
          const rows = points.flatMap((point) => {
            const datum = point.datum as Row
            if (seen.has(datum.series)) return []
            seen.add(datum.series)
            const isCurrent = datum.series === current.name
            const timestamp = dates[datum.day - 1]
            const label =
              isCurrent || timestamp === undefined
                ? datum.series
                : `${datum.series} · ${dayLabel.format(timestamp - 30 * DAY_MS)}`
            return [
              { label, value: formatExact(datum.amount), color: isCurrent ? sunset : compare },
            ]
          })
          const first = points[0]?.datum as Row | undefined
          return { title: first ? formatDay(first.day) : undefined, rows }
        },
      },
      svgAnimation: true,
    })
  }, [current, dates, fillId, format, previous])

  return <Chart definition={definition} height={280} ariaLabel={ariaLabel} />
}
