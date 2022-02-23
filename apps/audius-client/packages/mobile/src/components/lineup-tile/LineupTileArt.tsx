import { useLoadImageWithTimeout } from 'audius-client/src/common/hooks/useImageSize'
import { ID } from 'audius-client/src/common/models/Identifiers'
import {
  CoverArtSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { Remix } from 'audius-client/src/common/models/Track'
import { ImageStyle, StyleProp, View, ViewStyle } from 'react-native'

import CoSign, { Size } from 'app/components/co-sign'
import { DynamicImage } from 'app/components/core'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'

import { createStyles } from './styles'

type LineupTileArtProps = {
  coSign?: Remix | null
  coverArtSizes: CoverArtSizes
  id: ID
  isTrack: boolean
  onLoad: () => void
  style?: StyleProp<ViewStyle>
}

export const LineupTileArt = ({
  coSign,
  coverArtSizes,
  id,
  isTrack,
  onLoad,
  style
}: LineupTileArtProps) => {
  const styles = useThemedStyles(createStyles)
  const useImage = isTrack ? useTrackCoverArt : useCollectionCoverArt
  const image = useImage(id, coverArtSizes, SquareSizes.SIZE_150_BY_150)

  useLoadImageWithTimeout(image, onLoad)

  const imageElement = (
    <DynamicImage
      source={{ uri: image }}
      styles={{ image: styles.image as ImageStyle }}
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
