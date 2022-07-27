import { useCallback, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import IconPause from 'app/assets/animations/iconPause.json'
import IconPlay from 'app/assets/animations/iconPlay.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { pause, play } from 'app/store/audio/actions'
import { getPlaying } from 'app/store/audio/selectors'
import { colorize } from 'app/utils/colorizeLottie'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

type PlayButtonProps = Omit<AnimatedButtonProps, 'iconJSON' | 'iconIndex'>

export const PlayButton = ({ isActive, ...props }: PlayButtonProps) => {
  const isPlaying = useSelector(getPlaying)
  const dispatch = useDispatch()
  const themeVariant = useThemeVariant()
  const { primary, staticWhite, background } = useThemeColors()

  const iconColor = useMemo(
    () => (themeVariant === Theme.MATRIX ? background : staticWhite),
    [background, staticWhite, themeVariant]
  )

  const iconJSON = useMemo(() => {
    const ColorizedPlayIcon = colorize(IconPlay, {
      // #playpause1.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k': iconColor,
      // #playpause2.Left.Fill 1
      'layers.1.shapes.0.it.1.c.k': iconColor,
      // #playpause2.Right.Fill 1
      'layers.1.shapes.1.it.1.c.k': iconColor,
      // #primaryBG.Group 2.Fill 1
      'layers.2.shapes.0.it.1.c.k': primary
    })

    const ColorizedPauseIcon = colorize(IconPause, {
      // #playpause1.Group 1.Fill 1
      'layers.0.shapes.0.it.1.c.k': iconColor,
      // #playpause2.Left.Fill 1
      'layers.1.shapes.0.it.1.c.k': iconColor,
      // #playpause2.Right.Fill 1
      'layers.1.shapes.1.it.1.c.k': iconColor,
      // #primaryBG.Group 2.Fill 1
      'layers.2.shapes.0.it.1.c.k': primary
    })
    return [ColorizedPlayIcon, ColorizedPauseIcon]
  }, [iconColor, primary])

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
      iconJSON={iconJSON}
      onPress={handlePress}
      iconIndex={isPlaying ? 1 : 0}
    />
  )
}
