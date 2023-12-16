import type { ComponentType, ReactNode } from 'react'
import { useMemo, createContext } from 'react'

import type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationOptions
} from '@react-navigation/material-top-tabs'
import { View, type Animated } from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import { Tabs } from 'react-native-collapsible-tab-view'
import type { SvgProps } from 'react-native-svg'

import { Text } from '@audius/harmony-native'
import { TopTabBar } from 'app/components/top-tab-bar'

type CollapsibleTabNavigatorContextProps = {
  sceneName?: string
  refreshing?: boolean
  onRefresh?: () => void
  scrollY?: Animated.Value
  params?: Record<string, unknown>
}

export const CollapsibleTabNavigatorContext =
  createContext<CollapsibleTabNavigatorContextProps>({
    sceneName: undefined,
    refreshing: undefined,
    onRefresh: undefined,
    scrollY: undefined
  })

type CollapsibleTabNavigatorContextProviderProps = {
  sceneName: string
  refreshing?: boolean
  onRefresh?: () => void
  scrollY?: Animated.Value
  children: ReactNode
  params?: Record<string, unknown>
}

export const CollapsibleTabNavigatorContextProvider = (
  props: CollapsibleTabNavigatorContextProviderProps
) => {
  const { sceneName, refreshing, onRefresh, scrollY, params, children } = props

  const context = useMemo(
    () => ({ sceneName, refreshing, onRefresh, scrollY, params }),
    [sceneName, refreshing, onRefresh, scrollY, params]
  )

  return (
    <CollapsibleTabNavigatorContext.Provider value={context}>
      {children}
    </CollapsibleTabNavigatorContext.Provider>
  )
}

const tabBar = (props: TabBarProps) => <TopTabBar {...props} />

type CollapsibleTabNavigatorProps = {
  /**
   * Function that renders the collapsible header
   */
  renderHeader: () => ReactElement

  /**
   * Animated value to capture scrolling. If unset, an
   * animated value is created.
   */
  animatedValue?: Animated.Value

  initialScreenName?: string
  children: ReactNode
  screenOptions?: MaterialTopTabNavigationOptions
  headerHeight?: number
}

const Header = () => {
  return (
    <View>
      <Text>hello world</Text>
    </View>
  )
}

export const CollapsibleTabNavigator = ({
  renderHeader,
  animatedValue,
  initialScreenName,
  children,
  screenOptions,
  headerHeight
}: CollapsibleTabNavigatorProps) => {
  const collapsibleOptions = useMemo(
    () => ({ disableSnap: true, animatedValue }),
    [animatedValue]
  )

  return (
    <Tabs.Container
      renderHeader={renderHeader}
      headerHeight={headerHeight}
      collapsibleOptions={collapsibleOptions}
      initialRouteName={initialScreenName}
      // renderTabBar={tabBar}
      screenOptions={screenOptions}
    >
      {children}
    </Tabs.Container>
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
  refreshing?: boolean
  onRefresh?: () => void
  scrollY?: Animated.Value
}

export const collapsibleTabScreen = (config: TabScreenConfig) => {
  const {
    key,
    name,
    label,
    Icon,
    component: Component,
    initialParams,
    refreshing,
    onRefresh,
    scrollY
  } = config

  return (
    <Tabs.Tab
      key={key}
      name={name}
      // options={{
      //   tabBarLabel: label ?? name,
      //   tabBarIcon: ({ color }) => <Icon fill={color} />
      // }}
      // initialParams={initialParams}
    >
      <CollapsibleTabNavigatorContextProvider
        sceneName={name}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollY={scrollY}
        params={initialParams}
      >
        <Component />
      </CollapsibleTabNavigatorContextProvider>
    </Tabs.Tab>
  )
}
