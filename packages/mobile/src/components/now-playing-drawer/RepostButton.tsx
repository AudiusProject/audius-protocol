import { useMemo } from 'react'

import IconRepostOffLight from 'app/assets/animations/iconRepostOffLight.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostOnLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type RepostButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const RepostButton = ({ isActive, ...props }: RepostButtonProps) => {
  const { neutral, primary } = useThemeColors()
  const ColorizedRepostOnIcon = useMemo(
    () =>
      colorize(IconRepostOnLight, {
        // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
        'assets.0.layers.0.shapes.0.it.3.c.k.0.s': neutral,
        // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
        'assets.0.layers.0.shapes.0.it.3.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  const ColorizedRepostOffIcon = useMemo(
    () =>
      colorize(IconRepostOffLight, {
        // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
        'assets.0.layers.0.shapes.0.it.3.c.k.0.s': primary,
        // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
        'assets.0.layers.0.shapes.0.it.3.c.k.1.s': neutral
      }),
    [neutral, primary]
  )

  const iconJSON = [ColorizedRepostOnIcon, ColorizedRepostOffIcon]

  return <AnimatedButton {...props} haptics iconJSON={iconJSON} />
}
