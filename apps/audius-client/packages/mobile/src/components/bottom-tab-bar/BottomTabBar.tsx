import { useCallback, useState } from 'react'

import {
  accountSelectors,
  explorePageActions,
  ExplorePageTabs
} from '@audius/common'
import type { BottomTabBarProps as RNBottomTabBarProps } from '@react-navigation/bottom-tabs'
// eslint-disable-next-line import/no-unresolved
import type { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import type { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import {
  openSignOn as _openSignOn,
  showRequiresAccountModal
} from 'audius-client/src/common/store/pages/signon/actions'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE,
  profilePage
} from 'audius-client/src/utils/route'
import { Animated } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { FULL_DRAWER_HEIGHT } from 'app/components/drawer'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'
import { makeStyles } from 'app/styles'

import { BottomTabBarButton } from './BottomTabBarButton'
import { BOTTOM_BAR_HEIGHT } from './constants'
const { setTab } = explorePageActions
const getUserHandle = accountSelectors.getUserHandle

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

export const BottomTabBar = ({
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
    () => dispatchWeb(setTab({ tab: ExplorePageTabs.FOR_YOU })),
    [dispatchWeb]
  )
  const scrollToTop = useCallback(
    () =>
      dispatchWeb({
        type: MessageType.SCROLL_TO_TOP
      }),
    [dispatchWeb]
  )

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
  const insets = useSafeAreaInsets()

  const rootStyle = [
    styles.root,
    {
      transform: [
        {
          translateY: interpolatePostion(translationAnim, insets.bottom)
        }
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
