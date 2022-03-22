import { useCallback } from 'react'

import { NavigationRoute } from '@sentry/react-native/dist/js/tracing/reactnavigation'
import LinearGradient from 'react-native-linear-gradient'

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
import { AnimatedButton } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

import { BOTTOM_BAR_HEIGHT } from './constants'

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
  navigate: (route: NavigationRoute, isFocused: boolean) => void
  onLongPress: GestureResponderHandler
  route: NavigationRoute
}

const useStyles = makeStyles(() => ({
  animatedButton: {
    width: '20%',
    display: 'flex',
    alignItems: 'center'
  },
  iconWrapper: {
    width: 28,
    height: BOTTOM_BAR_HEIGHT
  },
  underlay: {
    width: '100%',
    height: BOTTOM_BAR_HEIGHT,
    position: 'absolute'
  }
}))

export const BottomTabBarButton = ({
  isFocused,
  route,
  navigate,
  onLongPress
}: BottomTabBarButtonProps) => {
  const styles = useStyles()
  const { neutralLight8, neutralLight10 } = useThemeColors()
  const handlePress = useCallback(() => {
    navigate(route, isFocused)
  }, [navigate, route, isFocused])

  const handleLongPress = useCallback(() => {
    if (isFocused) {
      onLongPress()
    } else {
      handlePress()
    }
  }, [isFocused, handlePress, onLongPress])

  return (
    <AnimatedButton
      iconDarkJSON={icons.dark[route.name]}
      iconLightJSON={icons.light[route.name]}
      isActive={isFocused}
      onLongPress={handleLongPress}
      onPress={handlePress}
      style={styles.animatedButton}
      wrapperStyle={styles.iconWrapper}
      renderUnderlay={({ pressed }) =>
        pressed ? (
          <LinearGradient
            style={styles.underlay}
            colors={[neutralLight8, neutralLight10]}
          />
        ) : null
      }
    />
  )
}
