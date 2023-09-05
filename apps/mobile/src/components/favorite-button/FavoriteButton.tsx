import { useMemo } from 'react'

import { StyleSheet } from 'react-native'

import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteTrackTileOffLight.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteTrackTileOnLight.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

const styles = StyleSheet.create({
  icon: {
    height: 22,
    width: 22
  }
})

type FavoriteButtonProps = Omit<AnimatedButtonProps, 'iconJSON' | 'isDarkMode'>

export const FavoriteButton = ({ isActive, ...props }: FavoriteButtonProps) => {
  const { neutralLight4, primary } = useThemeColors()
  const wrapperStyle = useMemo(
    () => [
      styles.icon,
      props.isDisabled ? { opacity: 0.5 } : {},
      props.wrapperStyle
    ],
    [props.isDisabled, props.wrapperStyle]
  )

  const ColorizedOnIcon = useMemo(
    () =>
      colorize(IconFavoriteOnLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutralLight4,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutralLight4, primary]
  )

  const ColorizedOffIcon = useMemo(
    () =>
      colorize(IconFavoriteOffLight, {
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': primary,
        // icon_Favorites Outlines 2.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': neutralLight4
      }),
    [neutralLight4, primary]
  )

  const iconJSON = [ColorizedOnIcon, ColorizedOffIcon]

  return (
    <AnimatedButton
      {...props}
      haptics={!isActive}
      iconIndex={isActive ? 1 : 0}
      iconJSON={iconJSON}
      wrapperStyle={wrapperStyle}
    />
  )
}
