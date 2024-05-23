import { useCallback, useEffect, useState } from 'react'

import { playerActions, playerSelectors } from '@audius/common/store'
import { useIsPlaying } from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'

import IconLoadingSpinner from 'app/assets/animations/iconLoadingSpinner.json'
import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { makeAnimations } from 'app/styles'
import { colorize } from 'app/utils/colorizeLottie'
import { Theme } from 'app/utils/theme'

const { pause, play } = playerActions
const { getPlaying } = playerSelectors

// How long the buffer state must be active before we actively show a spinner
// This helps us avoid "flashes" of the spinner, as well as avoids the spinner at all if playback is fast
const BUFFER_TIMEOUT = 300 // ms

type PlayButtonProps = Omit<AnimatedButtonProps, 'iconJSON' | 'iconIndex'>

const useAnimatedIcons = makeAnimations(({ palette, type }) => {
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

  const ColorizedSpinnerIcon = IconLoadingSpinner
  return [ColorizedPlayIcon, ColorizedPauseIcon, ColorizedSpinnerIcon]
})

export const PlayButton = ({ isActive, ...props }: PlayButtonProps) => {
  const isPlaying = useSelector(getPlaying)
  const { bufferingDuringPlay } = useIsPlaying()
  const [showBufferState, setShowBufferState] = useState(false)

  const dispatch = useDispatch()
  const animatedIcons = useAnimatedIcons()

  // Change the buffer state only if the react-native-track-player buffer state has been active for longer than 300ms
  useEffect(() => {
    let timeout
    if (bufferingDuringPlay) {
      timeout = setTimeout(() => {
        setShowBufferState(true)
      }, BUFFER_TIMEOUT)
    } else {
      // console.log('false alarm buffer state')
      clearTimeout(timeout)
      setShowBufferState(false)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [bufferingDuringPlay])

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
      iconJSON={animatedIcons}
      onPress={handlePress}
      iconIndex={showBufferState ? 2 : isPlaying ? 1 : 0}
      lottieProps={showBufferState ? { loop: true, autoPlay: true } : undefined}
    />
  )
}
