import type { ComponentType, ReactNode } from 'react'
import { useMemo, createContext } from 'react'

import type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationOptions
} from '@react-navigation/material-top-tabs'
import type { Animated } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { CollapsibleTopTabBar } from './CollapsibleTopTabBar'
import { createCollapsibleTabNavigator } from './createCollapsibleTabNavigator'

const Tab = createCollapsibleTabNavigator()

type CollapsibleTabNavigatorContextProps = {
  refreshing?: boolean
  onRefresh?: () => void
  params?: Record<string, unknown>
}

export const CollapsibleTabNavigatorContext =
  createContext<CollapsibleTabNavigatorContextProps>({})

type CollapsibleTabNavigatorContextProviderProps = {
  refreshing?: boolean
  onRefresh?: () => void
  children: ReactNode
  params?: Record<string, unknown>
}

export const CollapsibleTabNavigatorContextProvider = (
  props: CollapsibleTabNavigatorContextProviderProps
) => {
  const { refreshing, onRefresh, params, children } = props

  const context = useMemo(
    () => ({ refreshing, onRefresh, params }),
    [refreshing, onRefresh, params]
  )

  return (
    <CollapsibleTabNavigatorContext.Provider value={context}>
      {children}
    </CollapsibleTabNavigatorContext.Provider>
  )
}

const renderTabBar = (props: MaterialTopTabBarProps) => (
  <CollapsibleTopTabBar {...props} />
)

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
  headerHeight?: number
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
    () => ({ renderHeader, disableSnap: true, animatedValue, headerHeight }),
    [animatedValue, headerHeight, renderHeader]
  )

  return (
    <Tab.Navigator
      collapsibleOptions={collapsibleOptions}
      initialRouteName={initialScreenName}
      screenOptions={{ ...screenOptions, lazy: false }}
      renderHeader={renderHeader}
      renderTabBar={renderTabBar}
      headerContainerStyle={{
        backgroundColor: 'red',
        shadowRadius: 0
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
  refreshing?: boolean
  onRefresh?: () => void
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
    onRefresh
  } = config

  return (
    <Tab.Screen
      key={key}
      name={name}
      options={{
        tabBarLabel: label ?? name,
        tabBarIcon: ({ color }) => (
          <Icon style={{ marginTop: 6 }} fill={color} />
        )
      }}
      initialParams={initialParams}
    >
      {() => (
        <CollapsibleTabNavigatorContextProvider
          refreshing={refreshing}
          onRefresh={onRefresh}
          params={initialParams}
        >
          <Component />
        </CollapsibleTabNavigatorContextProvider>
      )}
    </Tab.Screen>
  )
}
