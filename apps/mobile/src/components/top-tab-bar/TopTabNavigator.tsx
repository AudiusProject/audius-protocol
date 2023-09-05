import type { ComponentType, ReactNode } from 'react'

import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import type { SvgProps } from 'react-native-svg'

import { TopTabBar } from 'app/components/top-tab-bar'

const Tab = createMaterialTopTabNavigator()

type TabNavigatorProps = {
  initialScreenName?: string
  children: ReactNode
  screenOptions?: MaterialTopTabNavigationOptions
}

export const TabNavigator = ({
  initialScreenName,
  children,
  screenOptions
}: TabNavigatorProps) => {
  return (
    <Tab.Navigator
      initialRouteName={initialScreenName}
      tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        ...screenOptions
      }}
    >
      {children}
    </Tab.Navigator>
  )
}

type ScreenConfig = {
  name: string
  label?: string
  component: ComponentType<any>
  Icon: ComponentType<SvgProps>
}

type TabScreenConfig = ScreenConfig & {
  key?: string
  initialParams?: Record<string, unknown>
}

export const tabScreen = (config: TabScreenConfig) => {
  const { key, name, label, Icon, component, initialParams } = config
  return (
    <Tab.Screen
      key={key}
      name={name}
      component={component}
      options={{
        tabBarLabel: label ?? name,
        tabBarIcon: ({ color }) => <Icon fill={color} />
      }}
      initialParams={initialParams}
    />
  )
}

type TopTabsProps = {
  initialScreenName?: string
  screens?: ScreenConfig[]
}

export const TopTabNavigator = ({
  initialScreenName,
  screens
}: TopTabsProps) => {
  return (
    <TabNavigator initialScreenName={initialScreenName}>
      {screens?.map((screen) => tabScreen({ key: screen.name, ...screen }))}
    </TabNavigator>
  )
}
