import { memo, useMemo } from 'react'

import IconFavoriteLight from 'app/assets/animations/iconFavoriteLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type FavoritesButtonProps = BaseBottomTabBarButtonProps

export const FavoritesButton = memo((props: FavoritesButtonProps) => {
  const { primary, neutral } = useThemeColors()
  const IconFavorite = useMemo(
    () =>
      colorize(IconFavoriteLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  return (
    <BottomTabBarButton name='favorites' iconJSON={IconFavorite} {...props} />
  )
})
