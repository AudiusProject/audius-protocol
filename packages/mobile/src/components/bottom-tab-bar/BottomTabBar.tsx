import { useCallback } from 'react'

import type { BottomTabBarProps as RNBottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import type { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import { Animated } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { FULL_DRAWER_HEIGHT } from 'app/components/drawer'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import { makeStyles } from 'app/styles'

import { BottomTabBarButton } from './BottomTabBarButton'
import { BOTTOM_BAR_HEIGHT } from './constants'

type NavigationRoute = RNBottomTabBarProps['state']['routes'][0]

const useStyles = makeStyles(({ palette }) => ({
  root: {
    zIndex: 4,
    elevation: 4
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8,
    backgroundColor: palette.neutralLight10,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  }
}))

const interpolatePostion = (
  translationAnim: Animated.Value,
  bottomInset: number
) =>
  translationAnim.interpolate({
    inputRange: [
      0,
      FULL_DRAWER_HEIGHT - bottomInset - BOTTOM_BAR_HEIGHT - PLAY_BAR_HEIGHT,
      FULL_DRAWER_HEIGHT
    ],
    outputRange: [bottomInset + BOTTOM_BAR_HEIGHT, 0, 0]
  })

export type BottomTabBarProps = RNBottomTabBarProps & {
  /**
   * Translation animation to move the bottom bar as drawers
   * are opened behind it
   */
  translationAnim: Animated.Value

  navigation: NavigationHelpers<
    ParamListBase,
    BottomTabNavigationEventMap & {
      scrollToTop: {
        data: undefined
      }
    }
  >
}

export const BottomTabBar = (props: BottomTabBarProps) => {
  const { state, navigation, translationAnim } = props
  const styles = useStyles()

  const navigate = useCallback(
    (route: NavigationRoute, isFocused) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true
      })

      // Native navigation
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      } else if (isFocused) {
        navigation.emit({
          type: 'scrollToTop'
        })
      }
    },
    [navigation]
  )

  const handleLongPress = useCallback(() => {
    navigation.emit({
      type: 'scrollToTop'
    })
  }, [navigation])

  const insets = useSafeAreaInsets()

  const rootStyle = [
    styles.root,
    {
      transform: [
        { translateY: interpolatePostion(translationAnim, insets.bottom) }
      ]
    }
  ]

  return (
    <Animated.View style={rootStyle}>
      <SafeAreaView
        style={styles.bottomBar}
        edges={['bottom']}
        pointerEvents='auto'
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index
          const key = `${route.name}-button`
          return (
            <BottomTabBarButton
              route={route}
              key={key}
              isFocused={isFocused}
              navigate={navigate}
              onLongPress={handleLongPress}
            />
          )
        })}
      </SafeAreaView>
    </Animated.View>
  )
}
