import React, { useCallback, useEffect, useState } from 'react'

import { BottomTabBarProps as RNBottomTabBarProps } from '@react-navigation/bottom-tabs'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
// TODO: move these into /common
import { setTab } from 'audius-client/src/containers/explore-page/store/actions'
import { Tabs } from 'audius-client/src/containers/explore-page/store/types'
import {
  openSignOn as _openSignOn,
  showRequiresAccountModal
} from 'audius-client/src/containers/sign-on/store/actions'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE,
  getPathname,
  profilePage
} from 'audius-client/src/utils/route'
import { push } from 'connected-react-router'
import { Animated, LayoutChangeEvent, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import IconExploreDark from 'app/assets/animations/iconExploreDark.json'
import IconExploreLight from 'app/assets/animations/iconExploreLight.json'
import IconFavoriteDark from 'app/assets/animations/iconFavoriteDark.json'
import IconFavoriteLight from 'app/assets/animations/iconFavoriteLight.json'
import IconFeedDark from 'app/assets/animations/iconFeedDark.json'
import IconFeedLight from 'app/assets/animations/iconFeedLight.json'
import IconProfileDark from 'app/assets/animations/iconProfileDark.json'
import IconProfileLight from 'app/assets/animations/iconProfileLight.json'
import IconTrendingDark from 'app/assets/animations/iconTrendingDark.json'
import IconTrendingLight from 'app/assets/animations/iconTrendingLight.json'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'
import { getLocation } from 'app/store/lifecycle/selectors'
import { Theme, useTheme, useThemeVariant } from 'app/utils/theme'

import AnimatedBottomButton from './buttons/AnimatedBottomButton'

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

const icons = {
  light: {
    feed: IconFeedLight,
    trending: IconTrendingLight,
    explore: IconExploreLight,
    favorites: IconFavoriteLight,
    profile: IconProfileLight
  },
  dark: {
    feed: IconFeedDark,
    trending: IconTrendingDark,
    explore: IconExploreDark,
    favorites: IconFavoriteDark,
    profile: IconProfileDark
  }
}

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

export type BottomTabBarProps = {
  /**
   * Display properties on the bottom bar to control whether
   * the bottom bar is showing
   */
  display: { isShowing: boolean }
  /**
   * A function called when the compononent layout is complete
   */
  onLayout: (e: LayoutChangeEvent) => void
  /**
   * Translation animation to move the bottom bar as drawers
   * are opened behind it
   */
  translationAnim: Animated.Value
}

const BottomTabBar = ({
  display,
  state,
  navigation,
  translationAnim,
  onLayout
}: BottomTabBarProps & RNBottomTabBarProps) => {
  const bottomBarStyle = useTheme(styles.bottomBar, {
    borderTopColor: 'neutralLight8',
    backgroundColor: 'neutralLight10'
  })

  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK

  // Selectors
  const handle = useSelectorWeb(getUserHandle)
  const location = useSelector(getLocation)

  // Actions
  const dispatchWeb = useDispatchWeb()
  const openSignOn = useCallback(() => {
    dispatchWeb(_openSignOn(false))
    dispatchWeb(showRequiresAccountModal())
  }, [dispatchWeb])
  const goToRoute = useCallback((route: string) => dispatchWeb(push(route)), [
    dispatchWeb
  ])
  const resetExploreTab = useCallback(() => dispatchWeb(setTab(Tabs.FOR_YOU)), [
    dispatchWeb
  ])
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

  const userProfilePage = handle ? profilePage(handle) : null
  const navRoutes = new Set([
    FEED_PAGE,
    TRENDING_PAGE,
    EXPLORE_PAGE,
    FAVORITES_PAGE,
    userProfilePage
  ])

  const [lastNavRoute, setNavRoute] = useState(FEED_PAGE)
  const currentRoute = location && getPathname(location)

  if (lastNavRoute !== currentRoute) {
    // If the current route isn't what we memoized, check if it's a nav route
    // and update the current route if so
    if (navRoutes.has(currentRoute)) {
      setNavRoute(currentRoute)
    }
  }

  const onPress = useCallback(
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
            goToRoute(FEED_PAGE)
          }
        },
        trending: () => {
          goToRoute(TRENDING_PAGE)
        },
        explore: () => {
          goToRoute(EXPLORE_PAGE)
        },
        favorites: () => {
          if (!handle) {
            openSignOn()
          } else {
            goToRoute(FAVORITES_PAGE)
          }
        },
        profile: () => {
          if (!handle) {
            openSignOn()
          } else {
            goToRoute(profilePage(handle))
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
      }
    },
    [navigation, goToRoute, handle, openSignOn, resetExploreTab, scrollToTop]
  )

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
        onLayout={onLayout}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index
          const key = `${route.name}-button`
          return (
            <AnimatedBottomButton
              key={key}
              uniqueKey={key}
              isActive={isFocused}
              isDarkMode={isDarkMode}
              onPress={() => onPress(route, isFocused)}
              iconLightJSON={icons.light[route.name]}
              iconDarkJSON={icons.dark[route.name]}
            />
          )
        })}
      </SafeAreaView>
    </Animated.View>
  )
}

export default BottomTabBar
