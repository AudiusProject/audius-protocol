import { useCallback, useMemo, useRef } from 'react'

import {
  createNavigatorFactory,
  TabRouter,
  useNavigationBuilder
} from '@react-navigation/native'
import { Tabs } from 'react-native-collapsible-tab-view'

export const CollapsibleTabNavigator = ({
  renderHeader,
  animatedValue,
  initialScreenName,
  children,
  screenOptions,
  headerHeight,
  renderTabBar
}: any) => {
  const collapsibleOptions = useMemo(
    () => ({ renderHeader, disableSnap: true, animatedValue, headerHeight }),
    [animatedValue, headerHeight, renderHeader]
  )

  const { state, navigation, descriptors } = useNavigationBuilder(TabRouter, {
    children,
    screenOptions,
    initialRouteName: initialScreenName
  })

  const ref = useRef()

  const onTabChange = useCallback(
    ({ tabName }) => {
      const target = tabName.toString()
      const isFocused = target === state.routes[state.index].name

      // Don't do anything if we're already on the target tab
      if (isFocused) {
        return
      }

      // Find the index of the target route
      const index = state.routes.findIndex((route) => route.name === target)
      if (index === -1) return

      // Emit the event and navigate to the tab
      navigation.emit({
        type: 'tabPress',
        target: state.routes[index].key,
        canPreventDefault: true
      })

      navigation.navigate(target)
    },
    [navigation, state.routes, state.index]
  )

  return (
    <Tabs.Container
      ref={ref}
      {...collapsibleOptions}
      allowHeaderOverscroll
      initialTabName={state.routes[state.index].name}
      renderTabBar={(props) =>
        renderTabBar({ ...props, state, navigation, descriptors })
      }
      onTabChange={onTabChange}
      lazy={screenOptions?.lazy ?? false}
    >
      {state.routes.map((route) => (
        <Tabs.Tab
          key={route.key}
          name={route.name}
          label={descriptors[route.key]?.options?.title ?? route.name}
        >
          {descriptors[route.key].render()}
        </Tabs.Tab>
      ))}
    </Tabs.Container>
  )
}

export const createCollapsibleTabNavigator = createNavigatorFactory(
  CollapsibleTabNavigator
)
