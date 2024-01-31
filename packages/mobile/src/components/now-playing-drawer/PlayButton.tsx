import { useCallback } from 'react'

import { playerActions, playerSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { makeAnimations } from 'app/styles'
import { colorize } from 'app/utils/colorizeLottie'
import { Theme } from 'app/utils/theme'
const { pause, play } = playerActions
const { getPlaying } = playerSelectors

const useAnimations = makeAnimations(({ palette, type }) => {
  const iconColor =
    type === Theme.MATRIX ? palette.background : palette.staticWhite

  const ColorizedPlayIcon = colorize(IconPlay, {
    // #playpause1.Group 1.Fill 1
    'layers.0.shapes.0.it.1.c.k': iconColor,
    // #playpause2.Left.Fill 1
    'layers.1.shapes.0.it.1.c.k': iconColor,
    // #playpause2.Right.Fill 1
    'layers.1.shapes.1.it.1.c.k': iconColor,
    // #primaryBG.Group 2.Fill 1
    'layers.2.shapes.0.it.1.c.k': palette.primary
  })

  const ColorizedPauseIcon = colorize(IconPause, {
    // #playpause1.Group 1.Fill 1
    'layers.0.shapes.0.it.1.c.k': iconColor,
    // #playpause2.Left.Fill 1
    'layers.1.shapes.0.it.1.c.k': iconColor,
    // #playpause2.Right.Fill 1
    'layers.1.shapes.1.it.1.c.k': iconColor,
    // #primaryBG.Group 2.Fill 1
    'layers.2.shapes.0.it.1.c.k': palette.primary
  })

  return [ColorizedPlayIcon, ColorizedPauseIcon]
})

type PlayButtonProps = Omit<AnimatedButtonProps, 'iconJSON' | 'iconIndex'>

export const PlayButton = ({ isActive, ...props }: PlayButtonProps) => {
  const isPlaying = useSelector(getPlaying)
  const dispatch = useDispatch()
  const animations = useAnimations()

  const handlePress = useCallback(() => {
    if (isPlaying) {
      dispatch(pause())
    } else {
      dispatch(play())
    }
  }, [isPlaying, dispatch])

  return (
    <AnimatedButton
      {...props}
      resizeMode='cover'
      haptics
      iconJSON={animations}
      onPress={handlePress}
      iconIndex={isPlaying ? 1 : 0}
    />
  )
}
