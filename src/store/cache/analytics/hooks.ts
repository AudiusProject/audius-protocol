import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import Audius from 'services/Audius'
import { AppState } from 'store/types'
import {
  setApiCalls,
  setTotalStaked,
  setPlays,
  setTrailingApiCalls,
  Bucket,
  TimeSeriesRecord,
  CountRecord,
  setTopApps,
  setTrailingTopGenres
} from './slice'
import { useEffect, useState } from 'react'
import { DiscoveryProvider } from 'types'
import { useDiscoveryProviders } from '../discoveryProvider/hooks'
import { useAverageBlockTime, useEthBlockNumber } from '../protocol/hooks'
import { weiAudToAud } from 'utils/numeric'
import { ELECTRONIC_SUB_GENRES } from './genres'

dayjs.extend(duration)

const MONTH_IN_MS = dayjs.duration({ months: 1 }).asMilliseconds()
const YEAR_IN_MS = dayjs.duration({ months: 12 }).asMilliseconds()
const WEEK_IN_MS = dayjs.duration({ weeks: 1 }).asMilliseconds()
const DAY_IN_MS = dayjs.duration({ days: 1 }).asMilliseconds()

const BUCKET_GRANULARITY_MAP = {
  [Bucket.ALL_TIME]: 'month',
  [Bucket.YEAR]: 'month',
  [Bucket.MONTH]: 'day',
  [Bucket.WEEK]: 'day',
  [Bucket.DAY]: 'hour'
}

const BUCKET_TO_BLOCK_COUNT_MAP = {
  [Bucket.ALL_TIME]: 12,
  [Bucket.YEAR]: 12,
  [Bucket.MONTH]: 30,
  [Bucket.WEEK]: 7,
  [Bucket.DAY]: 24
}

const BUCKET_TO_TEXT_FORMAT = {
  [Bucket.ALL_TIME]: 'All Time',
  [Bucket.YEAR]: 'This Year',
  [Bucket.MONTH]: 'This Month',
  [Bucket.WEEK]: 'This Week',
  [Bucket.DAY]: 'Today'
}

export const formatBucketText = (bucket: string) =>
  BUCKET_TO_TEXT_FORMAT[bucket as Bucket]

/**
 * Calculates the query start time for a given bucket
 * Note: we round to the start of the hour to help with caching
 * @param bucket
 */
const getStartTime = (bucket: Bucket) => {
  switch (bucket) {
    case Bucket.ALL_TIME:
      return dayjs()
        .subtract(1, 'year')
        .startOf('hour')
        .unix()
    case Bucket.YEAR:
      return dayjs()
        .subtract(1, 'year')
        .startOf('hour')
        .unix()
    case Bucket.MONTH:
      return dayjs()
        .subtract(1, 'month')
        .startOf('hour')
        .unix()
    case Bucket.WEEK:
      return dayjs()
        .subtract(1, 'week')
        .startOf('hour')
        .unix()
    case Bucket.DAY:
      return dayjs()
        .subtract(1, 'day')
        .startOf('hour')
        .unix()
  }
}

const joinCountDatasets = (datasets: CountRecord[]) => {
  const result: CountRecord = {}

  for (let dataset of datasets) {
    Object.keys(dataset).forEach(key => {
      if (key in result) {
        result[key] += dataset[key]
      } else {
        result[key] = dataset[key]
      }
    })
  }

  return result
}

const joinTimeSeriesDatasets = (datasets: TimeSeriesRecord[][]) => {
  if (!datasets.length) return []
  const joined: TimeSeriesRecord[] = []

  const minLength = Math.min(
    ...datasets.filter(d => d.length > 0).map(d => d.length)
  )
  for (let i = 0; i < minLength; ++i) {
    const { timestamp } = datasets[0][i]
    let count: number = 0
    let unique_count: number = 0
    datasets.forEach(dataset => {
      if (!dataset[i]) return
      count += dataset[i].count
      if (dataset[i].unique_count) {
        unique_count += dataset[i].unique_count!
      }
    })
    joined.push({ timestamp, count, unique_count })
  }

  return joined
}

// -------------------------------- Selectors  ---------------------------------
export const getApiCalls = (state: AppState, { bucket }: { bucket: Bucket }) =>
  state.cache.analytics.apiCalls
    ? (state.cache.analytics.apiCalls[bucket] as TimeSeriesRecord[])
    : null
export const getTotalStaked = (
  state: AppState,
  { bucket }: { bucket: Bucket }
) =>
  state.cache.analytics.totalStaked
    ? (state.cache.analytics.totalStaked[bucket] as TimeSeriesRecord[])
    : null
export const getPlays = (state: AppState, { bucket }: { bucket: Bucket }) =>
  state.cache.analytics.plays
    ? (state.cache.analytics.plays[bucket] as TimeSeriesRecord[])
    : null
export const getTrailingApiCalls = (
  state: AppState,
  { bucket }: { bucket: Bucket }
) =>
  state.cache.analytics.trailingApiCalls
    ? (state.cache.analytics.trailingApiCalls[bucket] as CountRecord)
    : null
export const getTrailingTopGenres = (
  state: AppState,
  { bucket }: { bucket: Bucket }
) =>
  state.cache.analytics.trailingTopGenres
    ? (state.cache.analytics.trailingTopGenres[bucket] as CountRecord)
    : null
export const getTopApps = (state: AppState, { bucket }: { bucket: Bucket }) =>
  state.cache.analytics.topApps
    ? (state.cache.analytics.topApps[bucket] as CountRecord)
    : null

// -------------------------------- Thunk Actions  ---------------------------------

async function fetchTimeSeries(
  route: string,
  bucket: Bucket,
  nodes: DiscoveryProvider[]
) {
  const startTime = getStartTime(bucket)
  const datasets = (
    await Promise.all(
      nodes.map(async node => {
        try {
          const bucket_size = BUCKET_GRANULARITY_MAP[bucket]
          const url = `${node.endpoint}/v1/metrics/${route}?bucket_size=${bucket_size}&start_time=${startTime}`
          const res = await (await fetch(url)).json()
          return res.data
        } catch (e) {
          console.error(e)
          return null
        }
      })
    )
  ).filter(Boolean)

  const metric = joinTimeSeriesDatasets(datasets).reverse()
  return metric
}

export function fetchApiCalls(
  bucket: Bucket,
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const metric = await fetchTimeSeries('routes', bucket, nodes)
    dispatch(setApiCalls({ metric, bucket }))
  }
}

export function fetchPlays(
  bucket: Bucket,
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const metric = await fetchTimeSeries('plays', bucket, nodes.slice(0, 1))
    dispatch(setPlays({ metric, bucket }))
  }
}

export function fetchTotalStaked(
  bucket: Bucket,
  averageBlockTime: number,
  currentBlockNumber: number
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    let timeSliceMs: number
    switch (bucket) {
      case Bucket.ALL_TIME:
        timeSliceMs = YEAR_IN_MS
        break
      case Bucket.YEAR:
        timeSliceMs = YEAR_IN_MS
        break
      case Bucket.MONTH:
        timeSliceMs = MONTH_IN_MS
        break
      case Bucket.WEEK:
        timeSliceMs = WEEK_IN_MS
        break
      case Bucket.DAY:
        timeSliceMs = DAY_IN_MS
        break
    }

    // Get all the timestamps we want to query blocks for
    const points = BUCKET_TO_BLOCK_COUNT_MAP[bucket]
    const ts = new Date().getTime()
    const timestamps: number[] = [ts]
    for (let i = 1; i < points; ++i) {
      const time = ts - i * (timeSliceMs / points)
      timestamps.push(time)
    }

    // Get the nearest block to the target timestamps
    const blocks = await Promise.all(
      timestamps.map(async ts =>
        aud.getBlockNearTimestamp(averageBlockTime, currentBlockNumber, ts)
      )
    )

    // Get the stake value at each block
    const staked = await Promise.all(
      blocks.map(async block => aud.Staking.totalStakedAt(block.number))
    )

    // Format the metric & reverse order so we display reverse chronological
    const metric = staked
      .map((stake, i) => ({
        count: weiAudToAud(stake),
        timestamp: Math.round(timestamps[i] / 1000).toString()
      }))
      .reverse()

    dispatch(setTotalStaked({ metric, bucket }))
  }
}

export function fetchTrailingApiCalls(
  bucket: Bucket,
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const startTime = getStartTime(bucket)
    const datasets = (
      await Promise.all(
        nodes.map(async node => {
          try {
            const url = `${node.endpoint}/v1/metrics/routes?bucket_size=century&start_time=${startTime}`
            const res = await (await fetch(url)).json()
            return {
              count: res?.data?.[0]?.count ?? 0,
              unique_count: res?.data?.[0]?.unique_count ?? 0
            } as CountRecord
          } catch (e) {
            console.error(e)
            return {}
          }
        })
      )
    ).filter(Boolean)

    const metric = joinCountDatasets(datasets)

    dispatch(setTrailingApiCalls({ metric, bucket }))
  }
}

export function fetchTopApps(
  bucket: Bucket,
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  const limit = 8
  return async (dispatch, getState, aud) => {
    const startTime = getStartTime(bucket)
    const datasets = (
      await Promise.all(
        nodes.map(async node => {
          try {
            const url = `${node.endpoint}/v1/metrics/app_name?start_time=${startTime}&limit=${limit}&include_unknown=true`
            const res = await (await fetch(url)).json()
            if (!res.data) return {}
            let apps: CountRecord = {}
            res.data.forEach((app: { name: string; count: number }) => {
              const name =
                app.name === 'unknown' ? 'Audius Apps + Unknown' : app.name
              if (app.count > 0) {
                apps[name] = app.count
              }
            })
            return apps
          } catch (e) {
            console.error(e)
            return {}
          }
        })
      )
    ).filter(Boolean)

    const metric = joinCountDatasets(datasets)
    const keys = Object.keys(metric)
    keys.sort((a, b) => {
      return metric[b] - metric[a]
    })
    const m = keys.slice(0, limit).reduce((acc, cur) => {
      acc[cur] = metric[cur]
      return acc
    }, {} as CountRecord)

    dispatch(setTopApps({ metric: m, bucket }))
  }
}

export function fetchTrailingTopGenres(
  bucket: Bucket,
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const node = nodes[0]
    if (!node) return
    try {
      const startTime = getStartTime(bucket)
      const url = `${node.endpoint}/v1/metrics/genres?start_time=${startTime}`
      const res = await (await fetch(url)).json()

      const agg: CountRecord = {
        Electronic: 0
      }
      res.data.forEach((genre: { name: string; count: number }) => {
        const name = genre.name
        if (ELECTRONIC_SUB_GENRES.has(name)) {
          agg['Electronic'] += genre.count
        } else {
          agg[name] = genre.count
        }
      })
      const metric: CountRecord = {}
      Object.keys(agg)
        .map(m => [m, agg[m]])
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .forEach(m => {
          metric[m[0] as string] = m[1] as number
        })

      dispatch(setTrailingTopGenres({ metric, bucket }))
    } catch (e) {
      console.error(e)
    }
  }
}

// -------------------------------- Hooks  --------------------------------

export const useApiCalls = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const apiCalls = useSelector(state =>
    getApiCalls(state as AppState, { bucket })
  )
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      nodes.length &&
      (apiCalls === null || apiCalls === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchApiCalls(bucket, nodes))
    }
  }, [dispatch, apiCalls, bucket, nodes, doOnce])

  useEffect(() => {
    if (apiCalls) {
      setDoOnce(null)
    }
  }, [apiCalls, setDoOnce])

  return { apiCalls }
}

export const useTotalStaked = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const totalStaked = useSelector(state =>
    getTotalStaked(state as AppState, { bucket })
  )
  const averageBlockTime = useAverageBlockTime()
  const currentBlockNumber = useEthBlockNumber()
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      averageBlockTime !== undefined &&
      currentBlockNumber !== undefined &&
      (totalStaked === null || totalStaked === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchTotalStaked(bucket, averageBlockTime, currentBlockNumber))
    }
  }, [
    dispatch,
    totalStaked,
    bucket,
    doOnce,
    averageBlockTime,
    currentBlockNumber
  ])

  useEffect(() => {
    if (totalStaked) {
      setDoOnce(null)
    }
  }, [totalStaked, setDoOnce])

  return { totalStaked }
}

export const usePlays = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const plays = useSelector(state => getPlays(state as AppState, { bucket }))
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      nodes.length &&
      (plays === null || plays === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchPlays(bucket, nodes))
    }
  }, [dispatch, plays, bucket, nodes, doOnce])

  useEffect(() => {
    if (plays) {
      setDoOnce(null)
    }
  }, [plays, setDoOnce])

  return { plays }
}

export const useTrailingApiCalls = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const apiCalls = useSelector(state =>
    getTrailingApiCalls(state as AppState, { bucket })
  )
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      nodes.length &&
      (apiCalls === null || apiCalls === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchTrailingApiCalls(bucket, nodes))
    }
  }, [dispatch, apiCalls, bucket, nodes, doOnce])

  useEffect(() => {
    if (apiCalls) {
      setDoOnce(null)
    }
  }, [apiCalls, setDoOnce])

  return { apiCalls }
}

export const useTrailingTopGenres = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const topGenres = useSelector(state =>
    getTrailingTopGenres(state as AppState, { bucket })
  )
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      nodes.length &&
      (topGenres === null || topGenres === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchTrailingTopGenres(bucket, nodes))
    }
  }, [dispatch, topGenres, bucket, nodes, doOnce])

  useEffect(() => {
    if (topGenres) {
      setDoOnce(null)
    }
  }, [topGenres, setDoOnce])

  return { topGenres }
}

export const useTopApps = (bucket: Bucket) => {
  const [doOnce, setDoOnce] = useState<Bucket | null>(null)
  const topApps = useSelector(state =>
    getTopApps(state as AppState, { bucket })
  )
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      doOnce !== bucket &&
      nodes.length &&
      (topApps === null || topApps === undefined)
    ) {
      setDoOnce(bucket)
      dispatch(fetchTopApps(bucket, nodes))
    }
  }, [dispatch, topApps, bucket, nodes, doOnce])

  useEffect(() => {
    if (topApps) {
      setDoOnce(null)
    }
  }, [topApps, setDoOnce])

  return { topApps }
}
