import { useCallback, useMemo, useRef } from 'react'

import {
  createNavigatorFactory,
  TabRouter,
  useNavigationBuilder
} from '@react-navigation/native'
import { Tabs } from 'react-native-collapsible-tab-view'
import { Flex, Text } from '@audius/harmony-native'

const Header = () => {
  return (
    <Flex backgroundColor='red' h={200}>
      <Text>hello world</Text>
    </Flex>
  )
}

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

  console.log('renderTabBar', renderTabBar)

  const { state, navigation, descriptors } = useNavigationBuilder(TabRouter, {
    children,
    screenOptions,
    initialRouteName: initialScreenName
  })

  const ref = useRef()

  const onTabChange = useCallback(
    ({ tabName }) => {
      navigation.emit({
        type: 'tabPress',
        target: tabName.toString(),
        data: {
          isAlreadyFocused:
            tabName.toString() === state.routes[state.index].name
        }
      })
    },
    [navigation, state.index, state.routes]
  )

  return (
    <Tabs.Container
      ref={ref}
      {...collapsibleOptions}
      initialTabName={state.routes[state.index].name}
      renderTabBar={(props) =>
        renderTabBar({ ...props, state, navigation, descriptors })
      }
      onTabChange={onTabChange}
      // screenOptions={{ ...screenOptions, lazy: false }}
    >
      {state.routes.map((route) => (
        <Tabs.Tab
          key={route.key}
          name={route.name}
          label={descriptors[route.name]?.options?.title}
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
