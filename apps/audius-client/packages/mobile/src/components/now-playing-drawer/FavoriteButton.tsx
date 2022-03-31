import { useMemo } from 'react'

import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteOffLight.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteOnLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type FavoriteButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const FavoriteButton = ({ isActive, ...props }: FavoriteButtonProps) => {
  const { neutral, primary } = useThemeColors()
  const ColorizedFavoriteOnIcon = useMemo(
    () =>
      colorize(IconFavoriteOnLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedFavoriteOffIcon = useMemo(
    () =>
      colorize(IconFavoriteOffLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': primary,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': neutral
      }),
    [neutral, primary]
  )

  const iconJSON = [ColorizedFavoriteOnIcon, ColorizedFavoriteOffIcon]

  return <AnimatedButton {...props} haptics iconJSON={iconJSON} />
}
