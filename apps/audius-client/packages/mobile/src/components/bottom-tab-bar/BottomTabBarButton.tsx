import { useCallback } from 'react'

import { NavigationRoute } from '@sentry/react-native/dist/js/tracing/reactnavigation'

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
import { GestureResponderHandler } from 'app/types/gesture'

import AnimatedBottomButton from './buttons/AnimatedBottomButton'

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

type BottomTabBarButtonProps = {
  isFocused: boolean
  isDarkMode: boolean
  route: NavigationRoute
  navigate: (route: NavigationRoute, isFocused: boolean) => void
  onLongPress: GestureResponderHandler
}

export const BottomTabBarButton = ({
  isFocused,
  isDarkMode,
  route,
  navigate,
  onLongPress
}: BottomTabBarButtonProps) => {
  const handlePress = useCallback(() => {
    navigate(route, isFocused)
  }, [navigate, route, isFocused])
  return (
    <AnimatedBottomButton
      isActive={isFocused}
      isDarkMode={isDarkMode}
      onPress={handlePress}
      onLongPress={onLongPress}
      iconLightJSON={icons.light[route.name]}
      iconDarkJSON={icons.dark[route.name]}
    />
  )
}
