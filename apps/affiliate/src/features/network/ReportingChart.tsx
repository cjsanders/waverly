import { barX, colorLegend, defineChart, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { useMemo } from 'react'

export interface ReportTrendPoint {
  id: string
  label: string
  value: number
  previousValue?: number
}

export interface ReportRankingPoint {
  id: string
  label: string
  value: number
}

interface ReportingChartProps {
  mode: 'trend' | 'ranking'
  trend?: ReportTrendPoint[]
  ranking?: ReportRankingPoint[]
  metricLabel: string
  ariaLabel: string
}

const emptyTrend: ReportTrendPoint[] = []
const emptyRanking: ReportRankingPoint[] = []

export function ReportingChart({
  mode,
  trend = emptyTrend,
  ranking = emptyRanking,
  metricLabel,
  ariaLabel,
}: ReportingChartProps) {
  return mode === 'ranking' ? (
    <ReportRankingChart rows={ranking} metricLabel={metricLabel} ariaLabel={ariaLabel} />
  ) : (
    <ReportTrendChart rows={trend} metricLabel={metricLabel} ariaLabel={ariaLabel} />
  )
}

function ReportRankingChart({
  rows,
  metricLabel,
  ariaLabel,
}: {
  rows: ReportRankingPoint[]
  metricLabel: string
  ariaLabel: string
}) {
  const definition = useMemo(() => {
    const ranked = rows.slice(0, 8)
    return defineChart({
      marks: [
        barX(ranked, {
          id: 'report-ranking',
          x: 'value',
          y: 'label',
          key: 'id',
          fill: 'var(--chart-1)',
          radius: 3,
          inset: 2,
        }),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            label: metricLabel,
            ticks: { format: (value) => `$${Math.round(Number(value)).toLocaleString()}` },
          },
        },
        y: {
          scale: () =>
            scaleBand<string>()
              .domain(ranked.map((row) => row.label))
              .padding(0.12),
        },
      },
      theme: {
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        grid: 'var(--color-border)',
        background: 'transparent',
        palette: ['var(--chart-1)'],
      },
      tooltip,
      svgAnimation: true,
    })
  }, [metricLabel, rows])

  return <Chart definition={definition} height={300} ariaLabel={ariaLabel} />
}

function ReportTrendChart({
  rows,
  metricLabel,
  ariaLabel,
}: {
  rows: ReportTrendPoint[]
  metricLabel: string
  ariaLabel: string
}) {
  const definition = useMemo(() => {
    const chartRows = rows.flatMap((point, index) => {
      const current = { day: index + 1, amount: point.value, series: 'Selected period' }
      return point.previousValue === undefined
        ? [current]
        : [current, { day: index + 1, amount: point.previousValue, series: 'Previous period' }]
    })

    return defineChart({
      marks: [
        lineY(chartRows, {
          id: 'report-trend',
          x: 'day',
          y: 'amount',
          z: 'series',
          color: 'series',
          strokeWidth: 2,
        }),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          axis: { label: `${rows.length} reporting days` },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            label: metricLabel,
            ticks: { format: (value) => `$${Math.round(Number(value)).toLocaleString()}` },
          },
        },
      },
      color: { legend: colorLegend({ label: 'Period' }) },
      theme: {
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        grid: 'var(--color-border)',
        background: 'transparent',
        palette: ['var(--chart-1)', 'var(--chart-2)'],
      },
      tooltip,
      svgAnimation: true,
    })
  }, [metricLabel, rows])

  return <Chart definition={definition} height={300} ariaLabel={ariaLabel} />
}
