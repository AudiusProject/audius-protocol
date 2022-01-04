import React from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Dimensions, Text, View } from 'react-native'

import IconAllTime from 'app/assets/images/iconAllTime.svg'
import IconDay from 'app/assets/images/iconDay.svg'
import IconMonth from 'app/assets/images/iconMonth.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { TrendingStackParamList } from 'app/components/app-navigator/types'

type Props = NativeStackScreenProps<TrendingStackParamList, 'trending-stack'>

const screenHeight = Dimensions.get('window').height

const ThisWeekTab = () => {
  return <Text>This Week Tab</Text>
}
const ThisMonthTab = () => {
  return <Text>This Month Tab</Text>
}
const ThisYearTab = () => {
  return <Text>This Year Tab</Text>
}

const TrendingScreen = ({ navigation }: Props) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: screenHeight
      }}
    >
      <Text style={{ flex: 1 }}>Example trending screen</Text>
      <View style={{ flex: 10 }}>
        <TopTabNavigator
          initialScreen='tracks'
          screens={[
            {
              name: 'thisWeek',
              label: 'This Week',
              icon: IconDay,
              component: ThisWeekTab
            },
            {
              name: 'thisMonth',
              label: 'This Month',
              icon: IconMonth,
              component: ThisMonthTab
            },
            {
              name: 'thisYear',
              label: 'This Year',
              icon: IconAllTime,
              component: ThisYearTab
            }
          ]}
        />
      </View>
    </View>
  )
}

export default TrendingScreen
