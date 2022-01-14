import React from 'react'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { View } from 'react-native'

import { TopTabBar } from 'app/components/top-tab-bar'

const Tab = createMaterialTopTabNavigator()

type ScreenInfo = {
  name: string
  label?: string
  component: any
  icon?: React.ReactNode
}

type TopTabsProps = {
  initialScreen?: string
  screens?: ScreenInfo[]
}

const TopTabNavigator = ({ initialScreen, screens }: TopTabsProps) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Tab.Navigator
        initialRouteName={initialScreen}
        tabBar={props => <TopTabBar {...props} />}
        // Backup styles
        screenOptions={{
          tabBarActiveTintColor: '#CC0FE0',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { backgroundColor: 'white' },
          tabBarIndicatorStyle: {
            backgroundColor: '#CC0FE0',
            height: 3
          }
        }}
      >
        {(screens ?? []).map(screen => (
          <Tab.Screen
            name={screen.name}
            key={screen.name}
            component={screen.component}
            options={{
              tabBarLabel: screen.label ?? screen.name,
              tabBarIcon: () => screen.icon
            }}
          />
        ))}
      </Tab.Navigator>
    </View>
  )
}

export default TopTabNavigator
