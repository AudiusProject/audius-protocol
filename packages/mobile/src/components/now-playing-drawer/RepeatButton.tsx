import { useMemo } from 'react'

import IconRepeatAllLight from 'app/assets/animations/iconRepeatAllLight.json'
import IconRepeatOffLight from 'app/assets/animations/iconRepeatOffLight.json'
import IconRepeatSingleLight from 'app/assets/animations/iconRepeatSingleLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type RepeatButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const RepeatButton = ({ isActive, ...props }: RepeatButtonProps) => {
  const { background, neutral, primary } = useThemeColors()
  const ColorizedRepeatAllIcon = useMemo(
    () =>
      colorize(IconRepeatAllLight, {
        // repeat number Outlines.Group 1.Fill 1
        'assets.0.layers.0.shapes.0.it.1.c.k': background,
        // repeat number Outlines.Group 2.Fill 1
        'assets.0.layers.0.shapes.1.it.1.c.k': primary,
        // repeat number Outlines.Group 3.Fill 1
        'assets.0.layers.0.shapes.2.it.1.c.k': background,
        // repeat number Outlines.Group 4.Fill 1
        'assets.0.layers.0.shapes.3.it.1.c.k': '#000000',
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.0.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.1.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.1.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.2.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'assets.0.layers.1.shapes.0.it.1.c.k.2.e': neutral,
        // repeat number Outlines.Group 1.Fill 1
        'layers.1.shapes.0.it.1.c.k': background,
        // repeat number Outlines.Group 2.Fill 1
        'layers.1.shapes.1.it.1.c.k': primary,
        // repeat number Outlines.Group 3.Fill 1
        'layers.1.shapes.2.it.1.c.k': background,
        // repeat number Outlines.Group 4.Fill 1
        'layers.1.shapes.3.it.1.c.k': '#000000',
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.s': neutral,
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.2.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.2.e': neutral
      }),
    [background, neutral, primary]
  )

  const ColorizedRepeatSingleIcon = useMemo(
    () =>
      colorize(IconRepeatSingleLight, {
        // repeat number Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k': background,
        // repeat number Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.1.c.k': primary,
        // repeat number Outlines.Group 3.Fill 1
        'layers.0.shapes.2.it.1.c.k': background,
        // repeat number Outlines.Group 4.Fill 1
        'layers.0.shapes.3.it.1.c.k': '#000000',
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.e': neutral
      }),
    [background, neutral, primary]
  )

  const ColorizedRepeatOffIcon = useMemo(
    () =>
      colorize(IconRepeatOffLight, {
        // repeat number Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k': background,
        // repeat number Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.1.c.k': primary,
        // repeat number Outlines.Group 3.Fill 1
        'layers.0.shapes.2.it.1.c.k': background,
        // repeat number Outlines.Group 4.Fill 1
        'layers.0.shapes.3.it.1.c.k': '#000000',
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.e': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.s': primary,
        // repeat Outlines.Group 2.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.e': neutral
      }),
    [background, neutral, primary]
  )

  const iconJSON = [
    ColorizedRepeatAllIcon,
    ColorizedRepeatSingleIcon,
    ColorizedRepeatOffIcon
  ]

  return <AnimatedButton {...props} haptics iconJSON={iconJSON} />
}
