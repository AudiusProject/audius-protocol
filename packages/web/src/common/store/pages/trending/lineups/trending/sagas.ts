import { Track, Collection } from '@audius/common/models'
import { trendingPageLineupActions } from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

const {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX,
  trendingWeekActions,
  trendingMonthActions,
  trendingAllTimeActions
} = trendingPageLineupActions

class TrendingWeekSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_WEEK_PREFIX,
      trendingWeekActions,
      (store) => store.pages.trending.trendingWeek,
      ({ payload }) => payload?.tracks
    )
  }
}

class TrendingMonthSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      (store) => store.pages.trending.trendingMonth,
      ({ payload }) => payload?.tracks
    )
  }
}

class TrendingAllTimeSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_ALL_TIME_PREFIX,
      trendingAllTimeActions,
      (store) => store.pages.trending.trendingAllTime,
      ({ payload }) => payload?.tracks
    )
  }
}

export default function sagas() {
  return [
    ...new TrendingWeekSagas().getSagas(),
    ...new TrendingMonthSagas().getSagas(),
    ...new TrendingAllTimeSagas().getSagas()
  ]
}
