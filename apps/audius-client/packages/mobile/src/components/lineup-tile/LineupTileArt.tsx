import { useCallback, useEffect, useMemo } from 'react'

import type { Remix } from '@audius/common'
import { useInstanceVar } from '@audius/common'
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import CoSign, { Size } from 'app/components/co-sign'

import { useStyles as useTrackTileStyles } from './styles'
import type { LineupTileProps } from './types'

type LineupTileArtProps = {
  coSign?: Remix | null
  onLoad: () => void
  renderImage: LineupTileProps['renderImage']
  style?: StyleProp<ViewStyle>
}

const ARTWORK_HAS_LOADED_TIMEOUT = 1000

// We don't want to indefinitely delay tile loading
// waiting for the image, so set a timeout before
// we call callback().
export const useLoadImageWithTimeout = (
  callback: () => void,
  timeout: number = ARTWORK_HAS_LOADED_TIMEOUT
) => {
  const [getDidCallback, setDidCallback] = useInstanceVar(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if (!getDidCallback()) {
        callback()
        setDidCallback(true)
      }
    }, timeout)
    return () => clearTimeout(t)
  }, [callback, timeout, setDidCallback, getDidCallback])

  return useCallback(() => {
    if (!getDidCallback()) {
      callback()
      setDidCallback(true)
    }
  }, [callback, setDidCallback, getDidCallback])
}

export const LineupTileArt = ({
  coSign,
  onLoad,
  renderImage,
  style
}: LineupTileArtProps) => {
  const trackTileStyles = useTrackTileStyles()

  const imageStyles = useMemo(
    () => ({
      image: trackTileStyles.image as ImageStyle
    }),
    [trackTileStyles]
  )

  const onLoadWithTimeout = useLoadImageWithTimeout(onLoad)

  const imageElement = renderImage({
    styles: imageStyles,
    onLoad: onLoadWithTimeout
  })

  return coSign ? (
    <CoSign size={Size.SMALL} style={[style, trackTileStyles.image]}>
      {imageElement}
    </CoSign>
  ) : (
    <View style={[style, trackTileStyles.image]}>{imageElement}</View>
  )
}
