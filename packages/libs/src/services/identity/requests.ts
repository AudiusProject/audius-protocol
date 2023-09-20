import type { AxiosRequestConfig } from 'axios'

export type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'millennium'

type QueryParams = {
  id?: number[]
  limit?: number
  offset?: number
  start?: string
  end?: string
}

export const getTrackListens = (
  timeFrame: TimeFrame | null = null,
  idsArray: number[] | null = null,
  startTime: string | null = null,
  endTime: string | null = null,
  limit: number | null = null,
  offset: number | null = null
) => {
  let queryUrl = 'tracks/listens/'

  if (timeFrame != null) {
    switch (timeFrame) {
      case 'day':
      case 'week':
      case 'month':
      case 'year':
      case 'millennium':
        break
      default:
        throw new Error('Invalid timeFrame value provided')
    }
    queryUrl += timeFrame
  }

  const queryParams: QueryParams = {}

  if (idsArray !== null) {
    queryParams.id = idsArray
  }

  if (limit !== null) {
    queryParams.limit = limit
  }

  if (offset !== null) {
    queryParams.offset = offset
  }

  if (startTime != null) {
    queryParams.start = startTime
  }

  if (endTime != null) {
    queryParams.end = endTime
  }

  const req: AxiosRequestConfig = {
    url: queryUrl,
    method: 'get',
    params: queryParams
  }
  return req
}
