import { useCallback, useEffect } from 'react'

import { BottomTabBarProps as RNBottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
import { setTab } from 'audius-client/src/common/store/pages/explore/slice'
import { Tabs } from 'audius-client/src/common/store/pages/explore/types'
import {
  openSignOn as _openSignOn,
  showRequiresAccountModal
} from 'audius-client/src/pages/sign-on/store/actions'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE,
  profilePage
} from 'audius-client/src/utils/route'
import { Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'
import { Theme, useTheme, useThemeVariant } from 'app/utils/theme'

import { BottomTabBarButton } from './BottomTabBarButton'

type NavigationRoute = RNBottomTabBarProps['state']['routes'][0]

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',

    zIndex: 4,
    elevation: 4
  },
  bottomBar: {
    borderTopWidth: 1,

    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  }
})

const springToValue = (
  animation: Animated.Value,
  value: number,
  finished?: () => void
) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 150,
    friction: 25,
    useNativeDriver: true
  }).start(finished)
}

export type BottomTabBarProps = RNBottomTabBarProps & {
  /**
   * Display properties on the bottom bar to control whether
   * the bottom bar is showing
   */
  display: { isShowing: boolean }
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

export const BottomTabBar = ({
  display,
  state,
  navigation,
  translationAnim
}: BottomTabBarProps & RNBottomTabBarProps) => {
  const pushRouteWeb = usePushRouteWeb()
  const bottomBarStyle = useTheme(styles.bottomBar, {
    borderTopColor: 'neutralLight8',
    backgroundColor: 'neutralLight10'
  })

  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  // Selectors
  const handle = useSelectorWeb(getUserHandle)

  // Actions
  const dispatchWeb = useDispatchWeb()
  const openSignOn = useCallback(() => {
    dispatchWeb(_openSignOn(false))
    dispatchWeb(showRequiresAccountModal())
  }, [dispatchWeb])
  const resetExploreTab = useCallback(
    () => dispatchWeb(setTab({ tab: Tabs.FOR_YOU })),
    [dispatchWeb]
  )
  const scrollToTop = useCallback(
    () =>
      dispatchWeb({
        type: MessageType.SCROLL_TO_TOP
      }),
    [dispatchWeb]
  )

  // Animations
  const slideIn = useCallback(() => {
    springToValue(translationAnim, 0)
  }, [translationAnim])

  const slideOut = useCallback(() => {
    springToValue(translationAnim, 100)
  }, [translationAnim])

  useEffect(() => {
    if (display.isShowing) {
      slideIn()
    } else {
      slideOut()
    }
  }, [display, slideIn, slideOut])

  const navigate = useCallback(
    (route: NavigationRoute, isFocused) => {
      // Web navigation
      if (isFocused) {
        scrollToTop()
      }

      resetExploreTab()

      const webNavigationHandlers = {
        feed: () => {
          if (!handle) {
            openSignOn()
          } else {
            pushRouteWeb(FEED_PAGE)
          }
        },
        trending: () => {
          pushRouteWeb(TRENDING_PAGE)
        },
        explore: () => {
          pushRouteWeb(EXPLORE_PAGE)
        },
        favorites: () => {
          if (!handle) {
            openSignOn()
          } else {
            pushRouteWeb(FAVORITES_PAGE)
          }
        },
        profile: () => {
          if (!handle) {
            openSignOn()
          } else {
            pushRouteWeb(profilePage(handle))
          }
        }
      }

      webNavigationHandlers[route.name]?.()

      // Native navigation
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true
      })

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      } else if (isFocused) {
        navigation.emit({
          type: 'scrollToTop'
        })
      }
    },
    [navigation, pushRouteWeb, handle, openSignOn, resetExploreTab, scrollToTop]
  )

  const handleLongPress = () => {
    navigation.emit({
      type: 'scrollToTop'
    })
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: translationAnim
            }
          ]
        }
      ]}
    >
      <SafeAreaView
        style={bottomBarStyle}
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
              isDarkMode={isDarkMode}
              navigate={navigate}
              onLongPress={handleLongPress}
            />
          )
        })}
      </SafeAreaView>
    </Animated.View>
  )
}
