import { useMemo } from 'react'

import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteOffLight.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteOnLight.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type FavoriteButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const FavoriteButton = (props: FavoriteButtonProps) => {
  const { iconIndex } = props
  const { neutral, primary } = useThemeColors()

  const iconJSON = useMemo(() => {
    const ColorizedFavoriteOnIcon = colorize(IconFavoriteOnLight, {
      // icon_Favorites Outlines 2.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k.0.s': neutral,
      // icon_Favorites Outlines 2.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k.1.s': primary
    })

    const ColorizedFavoriteOffIcon = colorize(IconFavoriteOffLight, {
      // icon_Favorites Outlines 2.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k.0.s': primary,
      // icon_Favorites Outlines 2.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k.1.s': neutral
    })
    return [ColorizedFavoriteOnIcon, ColorizedFavoriteOffIcon]
  }, [neutral, primary])

  return (
    <AnimatedButton {...props} haptics={iconIndex === 0} iconJSON={iconJSON} />
  )
}
