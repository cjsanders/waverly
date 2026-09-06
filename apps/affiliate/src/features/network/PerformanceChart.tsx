import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { useMemo } from 'react'
import { dailyPerformance } from '../../../shared/demoData'

export function PerformanceChart({
  factor = 1,
  isOperator = true,
}: {
  factor?: number
  isOperator?: boolean
}) {
  const performanceChart = useMemo(() => {
    const rows = dailyPerformance.slice(-30).flatMap((day, index) => {
      if (isOperator) {
        return [
          {
            day: index + 1,
            amount: Math.round(day.publisherEarningsCents / 100),
            series: 'Publisher earnings',
          },
          {
            day: index + 1,
            amount: Math.round(day.waverlyRevenueCents / 100),
            series: 'Waverly revenue',
          },
        ]
      }
      const total = Math.round((day.publisherEarningsCents * factor) / 100)
      return [
        { day: index + 1, amount: Math.round(total * 0.74), series: 'Approved' },
        { day: index + 1, amount: Math.round(total * 0.26), series: 'Pending' },
      ]
    })

    return defineChart({
      marks: [
        lineY(rows, {
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
          axis: { label: 'Last 30 days' },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            label: 'USD',
            ticks: { format: (value) => `$${Number(value).toLocaleString()}` },
          },
        },
      },
      color: { legend: colorLegend({ label: isOperator ? 'Economic flow' : 'Earnings state' }) },
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
  }, [factor, isOperator])

  return (
    <Chart
      definition={performanceChart}
      height={280}
      ariaLabel={
        isOperator
          ? 'Publisher earnings and Waverly revenue over the last 30 days'
          : 'Approved and pending publisher earnings over the last 30 days'
      }
    />
  )
}
