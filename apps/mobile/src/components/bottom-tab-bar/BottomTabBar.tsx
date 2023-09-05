import { useCallback, useEffect } from 'react'

import type { BottomTabBarProps as RNBottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import type { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import { Animated } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { FULL_DRAWER_HEIGHT } from 'app/components/drawer'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import PushNotifications from 'app/notifications'
import { makeStyles } from 'app/styles'

import { bottomTabBarButtons } from './bottom-tab-bar-buttons'
import { BOTTOM_BAR_HEIGHT } from './constants'

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
) => ({
  transform: [
    {
      translateY: translationAnim.interpolate({
        inputRange: [
          0,
          FULL_DRAWER_HEIGHT -
            bottomInset -
            BOTTOM_BAR_HEIGHT -
            PLAY_BAR_HEIGHT,
          FULL_DRAWER_HEIGHT
        ],
        outputRange: [bottomInset + BOTTOM_BAR_HEIGHT, 0, 0]
      })
    }
  ]
})

export type BottomTabBarProps = Pick<RNBottomTabBarProps, 'state'> & {
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
  const styles = useStyles()
  const { translationAnim, navigation, state } = props
  const { routes, index: activeIndex } = state
  const insets = useSafeAreaInsets()

  // Provide PushNotification the bottom-bar navigation context to
  // switch to notification stack
  useEffect(() => {
    if (navigation) {
      PushNotifications.setBottomTabNavigation(navigation as any)
    }
  }, [navigation])

  const handlePress = useCallback(
    (isFocused: boolean, routeName: string, routeKey: string) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true
      })

      // Native navigation
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName)
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

  return (
    <Animated.View
      style={[styles.root, interpolatePostion(translationAnim, insets.bottom)]}
    >
      <SafeAreaView
        style={styles.bottomBar}
        edges={['bottom']}
        pointerEvents='auto'
      >
        {routes.map(({ name, key }, index) => {
          const BottomButton = bottomTabBarButtons[name]

          return (
            <BottomButton
              key={key}
              routeName={name}
              routeKey={key}
              isActive={index === activeIndex}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          )
        })}
      </SafeAreaView>
    </Animated.View>
  )
}
