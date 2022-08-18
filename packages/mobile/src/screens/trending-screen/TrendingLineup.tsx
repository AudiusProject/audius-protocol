import { useCallback, useEffect, useState } from 'react'

import { Name, TimeRange } from '@audius/common'
import { useNavigation } from '@react-navigation/native'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { setTrendingTimeRange } from 'audius-client/src/common/store/pages/trending/actions'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingAllTimeActions
} from 'audius-client/src/common/store/pages/trending/lineup/actions'
import {
  getDiscoverTrendingAllTimeLineup,
  getDiscoverTrendingMonthLineup,
  getDiscoverTrendingWeekLineup
} from 'audius-client/src/common/store/pages/trending/selectors'

import { Lineup } from 'app/components/lineup'
import type { LineupProps } from 'app/components/lineup/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make, track } from 'app/services/analytics'

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
  const trendingLineup = useSelectorWeb(selectorsMap[timeRange], isEqual)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()
  const trendingActions = actionsMap[timeRange]

  useEffect(() => {
    // @ts-ignore tabPress is not a valid event, and wasn't able to figure out a fix
    const tabPressListener = navigation.addListener('tabPress', () => {
      dispatchWeb(setTrendingTimeRange(timeRange))
    })

    return tabPressListener
  }, [navigation, dispatchWeb, timeRange])

  useEffect(() => {
    if (!trendingLineup.isMetadataLoading) {
      setIsRefreshing(false)
    }
  }, [trendingLineup])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatchWeb(trendingActions.refreshInView(true))
  }, [dispatchWeb, trendingActions])

  const handleLoadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatchWeb(
        trendingActions.fetchLineupMetadatas(offset, limit, overwrite)
      )
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatchWeb, trendingActions]
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
