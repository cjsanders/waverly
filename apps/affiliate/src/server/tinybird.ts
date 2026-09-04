import { createServerOnlyFn } from '@tanstack/react-start'

type TinybirdParameter = boolean | number | string | undefined

export const queryTinybird = createServerOnlyFn(
  async <Row>(pipe: string, parameters: Record<string, TinybirdParameter> = {}): Promise<Row[]> => {
    const token = process.env.TINYBIRD_PIPE_READ_TOKEN
    if (!token) throw new Error('TINYBIRD_PIPE_READ_TOKEN is required')

    const apiUrl = process.env.TINYBIRD_API_URL ?? 'https://api.tinybird.co'
    const url = new URL(`/v0/pipes/${encodeURIComponent(pipe)}.json`, apiUrl)

    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Tinybird query failed with status ${response.status}`)
    }

    const result = (await response.json()) as { data: Row[] }
    return result.data
  },
)
