import { ComponentType, createContext, ReactNode } from 'react'

import { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs'
import { Animated } from 'react-native'
import { createMaterialCollapsibleTopTabNavigator } from 'react-native-collapsible-tab-view'
import { SvgProps } from 'react-native-svg'

import { TopTabBar } from 'app/components/top-tab-bar'
import { makeStyles } from 'app/styles'

const Tab = createMaterialCollapsibleTopTabNavigator()

const useStyles = makeStyles(({ palette }) => ({
  root: { backgroundColor: palette.white },
  label: { fontSize: 12 },
  indicator: { backgroundColor: palette.primary, height: 3 }
}))

type CollapsibleTabNavigatorContextProps = {
  sceneName?: string
}

export const CollapsibleTabNavigatorContext = createContext<
  CollapsibleTabNavigatorContextProps
>({
  sceneName: undefined
})

export const CollapsibleTabNavigatorContextProvider = ({
  sceneName,
  children
}: {
  sceneName: string
  children: ReactNode
}) => {
  return (
    <CollapsibleTabNavigatorContext.Provider value={{ sceneName }}>
      {children}
    </CollapsibleTabNavigatorContext.Provider>
  )
}

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
  const styles = useStyles()
  return (
    <Tab.Navigator
      collapsibleOptions={{
        renderHeader,
        disableSnap: true,
        animatedValue
        // Lazy empirically helps with reducing "content offset" jumping.
        // Potentially related issue (not from the v2 codebase though)
        // https://github.com/PedroBern/react-native-collapsible-tab-view/pull/120
        // lazy: true
      }}
      initialRouteName={initialScreenName}
      tabBar={props => <TopTabBar {...props} />}
      screenOptions={{
        tabBarStyle: styles.root,
        tabBarLabelStyle: styles.label,
        tabBarIndicatorStyle: styles.indicator,
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

export const collapsibleTabScreen = (config: TabScreenConfig) => {
  const { key, name, label, Icon, component: Component, initialParams } = config

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
        <CollapsibleTabNavigatorContextProvider sceneName={name}>
          <Component />
        </CollapsibleTabNavigatorContextProvider>
      )}
    </Tab.Screen>
  )
}
