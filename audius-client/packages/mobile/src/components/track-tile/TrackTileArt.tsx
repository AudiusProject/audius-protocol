import React from 'react'

import {
  useTrackCoverArt,
  useCollectionCoverArt,
  useLoadImageWithTimeout
} from 'audius-client/src/common/hooks/useImageSize'
import { ID } from 'audius-client/src/common/models/Identifiers'
import {
  CoverArtSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { Remix } from 'audius-client/src/common/models/Track'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

import CoSign, { Size } from 'app/components/co-sign'
import DynamicImage from 'app/components/dynamic-image'

type TrackTileArtProps = {
  coSign?: Remix | null
  coverArtSizes: CoverArtSizes
  id: ID
  isTrack: boolean
  onLoad: () => void
  showSkeleton?: boolean
  style?: StyleProp<ViewStyle>
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 4,
    height: 74,
    width: 74
  }
})

export const TrackTileArt = ({
  coSign,
  coverArtSizes,
  id,
  isTrack,
  onLoad,
  showSkeleton,
  style
}: TrackTileArtProps) => {
  const useImage = isTrack ? useTrackCoverArt : useCollectionCoverArt
  const image = useImage(id, coverArtSizes, SquareSizes.SIZE_150_BY_150)

  useLoadImageWithTimeout(image, onLoad)

  const imageElement = (
    <DynamicImage
      image={showSkeleton ? undefined : { uri: image }}
      style={styles.image}
    />
  )

  return coSign ? (
    <CoSign size={Size.SMALL} style={[style, styles.image]}>
      {imageElement}
    </CoSign>
  ) : (
    <View style={[style, styles.image]}>{imageElement}</View>
  )
}
