import { useMemo } from 'react'

import { StyleSheet } from 'react-native'

import IconRepostOffDark from 'app/assets/animations/iconRepostTrackTileOffDark.json'
import IconRepostOffLight from 'app/assets/animations/iconRepostTrackTileOffLight.json'
import IconRepostOnDark from 'app/assets/animations/iconRepostTrackTileOnDark.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostTrackTileOnLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'

const styles = StyleSheet.create({
  icon: {
    height: 22,
    width: 22
  }
})

const iconLightJSON = [IconRepostOnLight, IconRepostOffLight]
const iconDarkJSON = [IconRepostOnDark, IconRepostOffDark]

type RepostButtonProps = Omit<
  AnimatedButtonProps,
  'iconLightJSON' | 'iconDarkJSON' | 'isDarkMode'
>

export const RepostButton = ({ isActive, ...props }: RepostButtonProps) => {
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
