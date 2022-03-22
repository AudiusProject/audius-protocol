import { useCallback, useEffect, useState } from 'react'

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
import { Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { NOW_PLAYING_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'
import { makeStyles } from 'app/styles'

import { BottomTabBarButton } from './BottomTabBarButton'

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
  display: { isShowing: boolean; isPlayBarShowing: boolean }
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
  const styles = useStyles()
  const [isNavigating, setIsNavigating] = useState(false)
  const pushRouteWeb = usePushRouteWeb()
  const handle = useSelectorWeb(getUserHandle)
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
      setIsNavigating(true)
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true
      })

      const performNavigation = () => {
        setIsNavigating(false)
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
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name)
        } else if (isFocused) {
          navigation.emit({
            type: 'scrollToTop'
          })
        }
      }

      // Slight delay to allow button to rerender before
      // new screen starts rendering
      setTimeout(performNavigation, 50)
    },
    [navigation, pushRouteWeb, handle, openSignOn, resetExploreTab, scrollToTop]
  )

  const handleLongPress = useCallback(() => {
    navigation.emit({
      type: 'scrollToTop'
    })
  }, [navigation])

  const rootStyle = [
    styles.root,
    display.isPlayBarShowing && { marginTop: NOW_PLAYING_BAR_HEIGHT + 8 },
    { transform: [{ translateY: translationAnim }] }
  ]

  return (
    <Animated.View style={rootStyle}>
      <SafeAreaView
        style={styles.bottomBar}
        edges={['bottom']}
        pointerEvents='auto'
      >
        {state.routes.map((route, index) => {
          const isFocused = !isNavigating && state.index === index
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
