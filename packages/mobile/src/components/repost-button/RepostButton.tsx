import { useMemo } from 'react'

import { StyleSheet } from 'react-native'

import IconRepostOffLight from 'app/assets/animations/iconRepostTrackTileOffLight.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostTrackTileOnLight.json'
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

type RepostButtonProps = Omit<AnimatedButtonProps, 'iconJSON' | 'isDarkMode'>

export const RepostButton = ({ isActive, ...props }: RepostButtonProps) => {
  const { neutralLight4, primary } = useThemeColors()
  const wrapperStyle = useMemo(
    () => [
      styles.icon,
      props.isDisabled ? { opacity: 0.5 } : {},
      props.wrapperStyle
    ],
    [props.isDisabled, props.wrapperStyle]
  )

  const iconJSON = useMemo(() => {
    const ColorizedOnIcon = colorize(IconRepostOnLight, {
      // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
      'assets.0.layers.0.shapes.0.it.3.c.k.0.s': neutralLight4,
      // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
      'assets.0.layers.0.shapes.0.it.3.c.k.1.s': primary
    })

    const ColorizedOffIcon = colorize(IconRepostOffLight, {
      // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
      'assets.0.layers.0.shapes.0.it.3.c.k.0.s': primary,
      // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
      'assets.0.layers.0.shapes.0.it.3.c.k.1.s': neutralLight4
    })

    return [ColorizedOnIcon, ColorizedOffIcon]
  }, [primary, neutralLight4])

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
