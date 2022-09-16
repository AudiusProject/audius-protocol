import type { ComponentType, ReactNode } from 'react'
import { useMemo, createContext } from 'react'

import type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationOptions
} from '@react-navigation/material-top-tabs'
import type { Animated } from 'react-native'
import { createMaterialCollapsibleTopTabNavigator } from 'react-native-collapsible-tab-view'
import type { SvgProps } from 'react-native-svg'

import { TopTabBar } from 'app/components/top-tab-bar'

const Tab = createMaterialCollapsibleTopTabNavigator()

type CollapsibleTabNavigatorContextProps = {
  sceneName?: string
  refreshing?: boolean
  onRefresh?: () => void
  scrollY?: Animated.Value
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
}

export const CollapsibleTabNavigatorContextProvider = (
  props: CollapsibleTabNavigatorContextProviderProps
) => {
  const { sceneName, refreshing, onRefresh, scrollY, children } = props

  const context = useMemo(
    () => ({ sceneName, refreshing, onRefresh, scrollY }),
    [sceneName, refreshing, onRefresh, scrollY]
  )

  return (
    <CollapsibleTabNavigatorContext.Provider value={context}>
      {children}
    </CollapsibleTabNavigatorContext.Provider>
  )
}

const tabBar = (props: MaterialTopTabBarProps) => <TopTabBar {...props} />

type CollapsibleTabNavigatorProps = {
  /**
   * Function that renders the collapsible header
   */
  renderHeader: () => ReactNode

  /**
   * Animated value to capture scrolling. If unset, an
   * animated value is created.
   */
  animatedValue?: Animated.Value

  initialScreenName?: string
  children: ReactNode
  screenOptions?: MaterialTopTabNavigationOptions
}

export const CollapsibleTabNavigator = ({
  renderHeader,
  animatedValue,
  initialScreenName,
  children,
  screenOptions
}: CollapsibleTabNavigatorProps) => {
  const collapsibleOptions = useMemo(
    () => ({ renderHeader, disableSnap: true, animatedValue }),
    [renderHeader, animatedValue]
  )

  return (
    <Tab.Navigator
      collapsibleOptions={collapsibleOptions}
      initialRouteName={initialScreenName}
      tabBar={tabBar}
      screenOptions={screenOptions}
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
    <Tab.Screen
      key={key}
      name={name}
      options={{
        tabBarLabel: label ?? name,
        tabBarIcon: ({ color }) => <Icon fill={color} />
      }}
      initialParams={initialParams}
    >
      {() => (
        <CollapsibleTabNavigatorContextProvider
          sceneName={name}
          refreshing={refreshing}
          onRefresh={onRefresh}
          scrollY={scrollY}
        >
          <Component />
        </CollapsibleTabNavigatorContextProvider>
      )}
    </Tab.Screen>
  )
}
