import { useMemo } from 'react'

import TimeRange from 'audius-client/src/common/models/TimeRange'
import { getTrendingGenre } from 'audius-client/src/common/store/pages/trending/selectors'
import { Dimensions, View } from 'react-native'

import IconAllTime from 'app/assets/images/iconAllTime.svg'
import IconDay from 'app/assets/images/iconDay.svg'
import IconMonth from 'app/assets/images/iconMonth.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { Header } from 'app/components/header'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { RewardsBanner } from './RewardsBanner'
import { TrendingFilterButton } from './TrendingFilterButton'
import { TrendingLineup } from './TrendingLineup'

const screenHeight = Dimensions.get('window').height

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

export const TrendingScreen = () => {
  const screens = useMemo(
    () => [
      {
        name: 'thisWeek',
        label: 'This Week',
        Icon: IconDay,
        component: ThisWeekTab
      },
      {
        name: 'thisMonth',
        label: 'This Month',
        Icon: IconMonth,
        component: ThisMonthTab
      },
      {
        name: 'thisYear',
        label: 'This Year',
        Icon: IconAllTime,
        component: ThisYearTab
      }
    ],
    []
  )

  return (
    <View style={{ height: screenHeight }}>
      <Header text='Trending'>
        <TrendingFilterButton />
      </Header>
      <TopTabNavigator initialScreenName='tracks' screens={screens} />
    </View>
  )
}
