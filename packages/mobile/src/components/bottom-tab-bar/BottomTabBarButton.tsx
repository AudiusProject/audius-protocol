import { useCallback, useMemo } from 'react'

import type { NavigationRoute } from '@sentry/react-native/dist/js/tracing/reactnavigation'
import LinearGradient from 'react-native-linear-gradient'

import IconExploreLight from 'app/assets/animations/iconExploreLight.json'
import IconFavoriteLight from 'app/assets/animations/iconFavoriteLight.json'
import IconFeedLight from 'app/assets/animations/iconFeedLight.json'
import IconProfileLight from 'app/assets/animations/iconProfileLight.json'
import IconTrendingLight from 'app/assets/animations/iconTrendingLight.json'
import { AnimatedButton } from 'app/components/core'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import { BOTTOM_BAR_BUTTON_HEIGHT } from './constants'

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
    height: BOTTOM_BAR_BUTTON_HEIGHT
  },
  underlay: {
    width: '100%',
    height: BOTTOM_BAR_BUTTON_HEIGHT,
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
  const { primary, neutral, neutralLight8, neutralLight10 } = useThemeColors()
  const handlePress = useCallback(() => {
    navigate(route, isFocused)
  }, [navigate, route, isFocused])

  const ColorizedFeedIcon = useMemo(
    () =>
      colorize(IconFeedLight, {
        // Shape Layer 1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 2.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 2.Group 5.Fill 1
        'layers.1.shapes.1.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 5.Fill 1
        'layers.1.shapes.1.it.1.c.k.1.s': primary,
        // icon_Feed Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.s': neutral,
        // icon_Feed Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.s': primary,
        // icon_Feed Outlines.Group 4.Fill 1
        'layers.2.shapes.1.it.1.c.k.0.s': neutral,
        // icon_Feed Outlines.Group 4.Fill 1
        'layers.2.shapes.1.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedTrendingIcon = useMemo(
    () =>
      colorize(IconTrendingLight, {
        // Shape Layer 4.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 4.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': neutral,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.s': primary,
        // Shape Layer 2.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 1.Group 4.Fill 1
        'layers.3.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 1.Group 4.Fill 1
        'layers.3.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedExploreIcon = useMemo(
    () =>
      colorize(IconExploreLight, {
        // icon_Explore Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.4.c.k.0.s': neutral,
        // icon_Explore Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.4.c.k.1.s': primary,
        // icon_Explore Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.0.c.k.0.s': neutral,
        // icon_Explore Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.0.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedFavoriteIcon = useMemo(
    () =>
      colorize(IconFavoriteLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedProfileIcon = useMemo(
    () =>
      colorize(IconProfileLight, {
        // icon_Profile Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.3.c.k.0.s': neutral,
        // icon_Profile Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.3.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const icons = {
    feed: ColorizedFeedIcon,
    trending: ColorizedTrendingIcon,
    explore: ColorizedExploreIcon,
    favorites: ColorizedFavoriteIcon,
    profile: ColorizedProfileIcon
  }

  const handleLongPress = useCallback(() => {
    if (isFocused) {
      onLongPress()
    } else {
      handlePress()
    }
  }, [isFocused, handlePress, onLongPress])

  return (
    <AnimatedButton
      iconJSON={icons[route.name]}
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
