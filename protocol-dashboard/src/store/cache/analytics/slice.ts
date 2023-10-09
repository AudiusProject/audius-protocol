import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type TimeSeriesRecord = {
  timestamp: string
  count?: number
  total_count?: number
  unique_count?: number
  summed_unique_count?: number
}

export type CountRecord = {
  [key: string]: number
}

export enum Bucket {
  ALL_TIME = 'all_time', // Granularity: year
  YEAR = 'year', // Granularity: month
  MONTH = 'month', // Granularity: week
  WEEK = 'week', // Granularity: day
  DAY = 'day' // Granularity: hour
}

export enum MetricError {
  ERROR = 'error'
}

type TimeSeriesMetric = {
  [key in Bucket]?: TimeSeriesRecord[] | MetricError
}

type CountMetric = {
  [key in Bucket]?: CountRecord | MetricError
}

export type State = {
  apiCalls: TimeSeriesMetric
  totalStaked: TimeSeriesMetric
  plays: TimeSeriesMetric
  topApps: CountMetric
  trailingTopGenres: CountMetric
  trailingApiCalls: CountMetric
}

export const initialState: State = {
  apiCalls: {},
  totalStaked: {},
  plays: {},
  topApps: {},
  trailingTopGenres: {},
  trailingApiCalls: {}
}

type SetApiCalls = { metric: TimeSeriesRecord[] | MetricError; bucket: Bucket }
type SetTotalStaked = {
  metric: TimeSeriesRecord[] | MetricError
  bucket: Bucket
}
type SetPlays = { metric: TimeSeriesRecord[] | MetricError; bucket: Bucket }
type SetTopApps = { metric: CountRecord | MetricError; bucket: Bucket }
type SetTrailingTopGenres = {
  metric: CountRecord | MetricError
  bucket: Bucket
}
type SetTrailingApiCalls = { metric: CountRecord | MetricError; bucket: Bucket }

const slice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setApiCalls: (state, action: PayloadAction<SetApiCalls>) => {
      const { metric, bucket } = action.payload
      state.apiCalls[bucket] = metric
    },
    setTotalStaked: (state, action: PayloadAction<SetTotalStaked>) => {
      const { metric, bucket } = action.payload
      state.totalStaked[bucket] = metric
    },
    setPlays: (state, action: PayloadAction<SetPlays>) => {
      const { metric, bucket } = action.payload
      state.plays[bucket] = metric
    },
    setTopApps: (state, action: PayloadAction<SetTopApps>) => {
      const { metric, bucket } = action.payload
      state.topApps[bucket] = metric
    },
    setTrailingTopGenres: (
      state,
      action: PayloadAction<SetTrailingTopGenres>
    ) => {
      const { metric, bucket } = action.payload
      state.trailingTopGenres[bucket] = metric
    },
    setTrailingApiCalls: (
      state,
      action: PayloadAction<SetTrailingApiCalls>
    ) => {
      const { metric, bucket } = action.payload
      state.trailingApiCalls[bucket] = metric
    }
  }
})

export const {
  setApiCalls,
  setTotalStaked,
  setPlays,
  setTopApps,
  setTrailingTopGenres,
  setTrailingApiCalls
} = slice.actions

export default slice.reducer
