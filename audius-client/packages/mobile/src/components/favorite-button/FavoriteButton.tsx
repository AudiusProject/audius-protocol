import { useMemo } from 'react'

import { StyleSheet } from 'react-native'

import IconFavoriteOffDark from 'app/assets/animations/iconFavoriteTrackTileOffDark.json'
import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteTrackTileOffLight.json'
import IconFavoriteOnDark from 'app/assets/animations/iconFavoriteTrackTileOnDark.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteTrackTileOnLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'

const styles = StyleSheet.create({
  icon: {
    height: 22,
    width: 22
  }
})

const iconLightJSON = [IconFavoriteOnLight, IconFavoriteOffLight]
const iconDarkJSON = [IconFavoriteOnDark, IconFavoriteOffDark]

type FavoriteButtonProps = Omit<
  AnimatedButtonProps,
  'iconLightJSON' | 'iconDarkJSON' | 'isDarkMode'
>

export const FavoriteButton = ({ isActive, ...props }: FavoriteButtonProps) => {
  const wrapperStyle = useMemo(
    () => [
      styles.icon,
      props.isDisabled ? { opacity: 0.5 } : {},
      props.wrapperStyle
    ],
    [props.isDisabled, props.wrapperStyle]
  )

  return (
    <AnimatedButton
      {...props}
      iconIndex={isActive ? 1 : 0}
      iconLightJSON={iconLightJSON}
      iconDarkJSON={iconDarkJSON}
      wrapperStyle={wrapperStyle}
    />
  )
}
