import { useMemo } from 'react'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type PlayButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const PlayButton = ({ isActive, ...props }: PlayButtonProps) => {
  const { background, primary } = useThemeColors()

  const ColorizedPlayIcon = useMemo(
    () =>
      colorize(IconPlay, {
        // #playpause1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k': background,
        // #playpause2.Left.Fill 1
        'layers.1.shapes.0.it.1.c.k': background,
        // #playpause2.Right.Fill 1
        'layers.1.shapes.1.it.1.c.k': background,
        // #primaryBG.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k': primary
      }),
    [background, primary]
  )

  const ColorizedPauseIcon = useMemo(
    () =>
      colorize(IconPause, {
        // #playpause1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k': background,
        // #playpause2.Left.Fill 1
        'layers.1.shapes.0.it.1.c.k': background,
        // #playpause2.Right.Fill 1
        'layers.1.shapes.1.it.1.c.k': background,
        // #primaryBG.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k': primary
      }),
    [background, primary]
  )

  const iconJSON = [ColorizedPlayIcon, ColorizedPauseIcon]

  return <AnimatedButton {...props} haptics iconJSON={iconJSON} />
}
