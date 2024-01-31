import { TimeRange, trendingPageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import {
  IconAllTime,
  IconCalendarDay,
  IconCalendarMonth,
  IconTrending
} from '@audius/harmony-native'
import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { TrendingFilterButton } from './TrendingFilterButton'
import { TrendingLineup } from './TrendingLineup'
const { getTrendingGenre } = trendingPageSelectors

const ThisWeekTab = () => {
  const trendingGenre = useSelector(getTrendingGenre)
  return (
    <TrendingLineup
      header={trendingGenre ? null : <RewardsBanner type='tracks' />}
      timeRange={TimeRange.WEEK}
      rankIconCount={5}
    />
  )
}
const ThisMonthTab = () => {
  return <TrendingLineup timeRange={TimeRange.MONTH} />
}

const AllTimeTab = () => {
  return <TrendingLineup timeRange={TimeRange.ALL_TIME} />
}

const trendingScreens = [
  {
    name: 'ThisWeek',
    label: 'This Week',
    Icon: IconCalendarDay,
    component: ThisWeekTab
  },
  {
    name: 'ThisMonth',
    label: 'This Month',
    Icon: IconCalendarMonth,
    component: ThisMonthTab
  },
  {
    name: 'AllTime',
    label: 'All Time',
    Icon: IconAllTime,
    component: AllTimeTab
  }
]

export const TrendingScreen = () => {
  useAppTabScreen()

  return (
    <Screen>
      <ScreenHeader text='Trending' icon={IconTrending}>
        <TrendingFilterButton />
      </ScreenHeader>
      <ScreenContent>
        <TopTabNavigator
          screens={trendingScreens}
          screenOptions={{ lazy: true }}
        />
      </ScreenContent>
    </Screen>
  )
}
