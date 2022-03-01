import TimeRange from 'audius-client/src/common/models/TimeRange'
import { getTrendingGenre } from 'audius-client/src/common/store/pages/trending/selectors'

import IconAllTime from 'app/assets/images/iconAllTime.svg'
import IconDay from 'app/assets/images/iconDay.svg'
import IconMonth from 'app/assets/images/iconMonth.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TrendingFilterButton } from './TrendingFilterButton'
import { TrendingLineup } from './TrendingLineup'

const ThisWeekTab = () => {
  const trendingGenre = useSelectorWeb(getTrendingGenre)
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

const ThisYearTab = () => {
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
    name: 'ThisYear',
    label: 'This Year',
    Icon: IconAllTime,
    component: ThisYearTab
  }
]

export const TrendingScreen = () => {
  return (
    <Screen>
      <Header text='Trending'>
        <TrendingFilterButton />
      </Header>
      <TopTabNavigator screens={trendingScreens} />
    </Screen>
  )
}
