import { trendingPageSelectors } from '@audius/common/store'

import { TimeRange } from '@audius/common/models'
import { useSelector } from 'react-redux'

import IconAllTime from 'app/assets/images/iconAllTime.svg'
import IconDay from 'app/assets/images/iconDay.svg'
import IconMonth from 'app/assets/images/iconMonth.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
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
    Icon: IconDay,
    component: ThisWeekTab
  },
  {
    name: 'ThisMonth',
    label: 'This Month',
    Icon: IconMonth,
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
