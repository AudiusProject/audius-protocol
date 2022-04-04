import { useCallback, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import { AnimatedButton, AnimatedButtonProps } from 'app/components/core'
import { pause, play } from 'app/store/audio/actions'
import { getPlaying } from 'app/store/audio/selectors'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

type PlayButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const PlayButton = ({ isActive, ...props }: PlayButtonProps) => {
  const isPlaying = useSelector(getPlaying)
  const dispatch = useDispatch()
  const { background, primary } = useThemeColors()

  const iconJSON = useMemo(() => {
    const ColorizedPlayIcon = colorize(IconPlay, {
      // #playpause1.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k': background,
      // #playpause2.Left.Fill 1
      'layers.1.shapes.0.it.1.c.k': background,
      // #playpause2.Right.Fill 1
      'layers.1.shapes.1.it.1.c.k': background,
      // #primaryBG.Group 2.Fill 1
      'layers.2.shapes.0.it.1.c.k': primary
    })

    const ColorizedPauseIcon = colorize(IconPause, {
      // #playpause1.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k': background,
      // #playpause2.Left.Fill 1
      'layers.1.shapes.0.it.1.c.k': background,
      // #playpause2.Right.Fill 1
      'layers.1.shapes.1.it.1.c.k': background,
      // #primaryBG.Group 2.Fill 1
      'layers.2.shapes.0.it.1.c.k': primary
    })
    return [ColorizedPlayIcon, ColorizedPauseIcon]
  }, [background, primary])

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
      haptics
      waitForAnimationFinish
      iconJSON={iconJSON}
      onPress={handlePress}
      iconIndex={isPlaying ? 1 : 0}
    />
  )
}
