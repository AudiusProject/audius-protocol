import { useMemo } from 'react'

import IconShuffleOffLight from 'app/assets/animations/iconShuffleOffLight.json'
import IconShuffleOnLight from 'app/assets/animations/iconShuffleOnLight.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type ShuffleButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const ShuffleButton = ({ isActive, ...props }: ShuffleButtonProps) => {
  const { neutral, primary } = useThemeColors()
  const ColorizedShuffleOnIcon = useMemo(
    () =>
      colorize(IconShuffleOnLight, {
        // Arrow 2.Head.Fill 1
        'layers.0.shapes.0.it.2.c.k.0.s': neutral,
        // Arrow 2.Head.Fill 1
        'layers.0.shapes.0.it.2.c.k.0.e': primary,
        // Arrow 2.Tail.Stroke 1
        'layers.0.shapes.1.it.1.c.k.0.s': neutral,
        // Arrow 2.Tail.Stroke 1
        'layers.0.shapes.1.it.1.c.k.0.e': primary,
        // Arrow 1.Head.Fill 1
        'layers.1.shapes.0.it.2.c.k.0.s': neutral,
        // Arrow 1.Head.Fill 1
        'layers.1.shapes.0.it.2.c.k.0.e': primary,
        // Arrow 1.Tail.Stroke 1
        'layers.1.shapes.1.it.1.c.k.0.s': neutral,
        // Arrow 1.Tail.Stroke 1
        'layers.1.shapes.1.it.1.c.k.0.e': primary
      }),
    [neutral, primary]
  )

  const ColorizedShuffleOffIcon = useMemo(
    () =>
      colorize(IconShuffleOffLight, {
        // Arrow 2.Head.Fill 1
        'layers.0.shapes.0.it.2.c.k.0.s': primary,
        // Arrow 2.Head.Fill 1
        'layers.0.shapes.0.it.2.c.k.0.e': neutral,
        // Arrow 2.Tail.Stroke 1
        'layers.0.shapes.1.it.1.c.k.0.s': primary,
        // Arrow 2.Tail.Stroke 1
        'layers.0.shapes.1.it.1.c.k.0.e': neutral,
        // Arrow 1.Head.Fill 1
        'layers.1.shapes.0.it.2.c.k.0.s': primary,
        // Arrow 1.Head.Fill 1
        'layers.1.shapes.0.it.2.c.k.0.e': neutral,
        // Arrow 1.Tail.Stroke 1
        'layers.1.shapes.1.it.1.c.k.0.s': primary,
        // Arrow 1.Tail.Stroke 1
        'layers.1.shapes.1.it.1.c.k.0.e': neutral
      }),
    [neutral, primary]
  )

  const iconJSON = [ColorizedShuffleOnIcon, ColorizedShuffleOffIcon]

  return <AnimatedButton {...props} haptics iconJSON={iconJSON} />
}
