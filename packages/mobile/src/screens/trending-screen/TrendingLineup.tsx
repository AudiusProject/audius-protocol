import { useCallback, useEffect, useState } from 'react'

import {
  Name,
  TimeRange,
  lineupSelectors,
  trendingPageLineupActions,
  trendingPageActions,
  trendingPageSelectors
} from '@audius/common'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'audius-client/src/utils/reducer'
import { useDispatch } from 'react-redux'

import { Lineup } from 'app/components/lineup'
import type { LineupProps } from 'app/components/lineup/types'
import { make, track } from 'app/services/analytics'
const {
  getDiscoverTrendingAllTimeLineup,
  getDiscoverTrendingMonthLineup,
  getDiscoverTrendingWeekLineup
} = trendingPageSelectors
const { setTrendingTimeRange } = trendingPageActions
const { trendingWeekActions, trendingMonthActions, trendingAllTimeActions } =
  trendingPageLineupActions
const { makeGetLineupMetadatas } = lineupSelectors

const getTrendingWeekLineup = makeGetLineupMetadatas(
  getDiscoverTrendingWeekLineup
)

const getTrendingMonthLineup = makeGetLineupMetadatas(
  getDiscoverTrendingMonthLineup
)

const getTrendingAllTimeLineup = makeGetLineupMetadatas(
  getDiscoverTrendingAllTimeLineup
)

const selectorsMap = {
  [TimeRange.WEEK]: getTrendingWeekLineup,
  [TimeRange.MONTH]: getTrendingMonthLineup,
  [TimeRange.ALL_TIME]: getTrendingAllTimeLineup
}

const actionsMap = {
  [TimeRange.WEEK]: trendingWeekActions,
  [TimeRange.MONTH]: trendingMonthActions,
  [TimeRange.ALL_TIME]: trendingAllTimeActions
}

type BaseLineupProps = Pick<LineupProps, 'header' | 'rankIconCount'>

type TrendingLineupProps = BaseLineupProps & {
  timeRange: TimeRange
}

export const TrendingLineup = (props: TrendingLineupProps) => {
  const { timeRange, ...other } = props
  const trendingLineup = useSelector(selectorsMap[timeRange])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const trendingActions = actionsMap[timeRange]

  useEffect(() => {
    // @ts-ignore tabPress is not a valid event, and wasn't able to figure out a fix
    const tabPressListener = navigation.addListener('tabPress', () => {
      dispatch(setTrendingTimeRange(timeRange))
    })

    return tabPressListener
  }, [navigation, dispatch, timeRange])

  useEffect(() => {
    if (!trendingLineup.isMetadataLoading) {
      setIsRefreshing(false)
    }
  }, [trendingLineup])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatch(trendingActions.refreshInView(true))
  }, [dispatch, trendingActions])

  const handleLoadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(trendingActions.fetchLineupMetadatas(offset, limit, overwrite))
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatch, trendingActions]
  )

  return (
    <Lineup
      isTrending
      lineup={trendingLineup}
      actions={trendingActions}
      refresh={handleRefresh}
      refreshing={isRefreshing}
      loadMore={handleLoadMore}
      selfLoad
      {...other}
    />
  )
}
