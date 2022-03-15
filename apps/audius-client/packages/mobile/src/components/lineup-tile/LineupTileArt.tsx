import { useLoadImageWithTimeout } from 'audius-client/src/common/hooks/useImageSize'
import { Remix } from 'audius-client/src/common/models/Track'
import { ImageStyle, StyleProp, View, ViewStyle } from 'react-native'

import CoSign, { Size } from 'app/components/co-sign'
import { DynamicImage } from 'app/components/core'
import { useThemedStyles } from 'app/hooks/useThemedStyles'

import { createStyles } from './styles'

type LineupTileArtProps = {
  coSign?: Remix | null
  imageUrl?: string
  onLoad: () => void
  style?: StyleProp<ViewStyle>
}

export const LineupTileArt = ({
  coSign,
  imageUrl,
  onLoad,
  style
}: LineupTileArtProps) => {
  const styles = useThemedStyles(createStyles)

  useLoadImageWithTimeout(imageUrl, onLoad)

  const imageElement = (
    <DynamicImage
      uri={imageUrl}
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
