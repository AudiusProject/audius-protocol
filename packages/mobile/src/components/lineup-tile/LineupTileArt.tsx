import type { Remix } from '@audius/common'
import { useLoadImageWithTimeout } from 'audius-client/src/common/hooks/useImageSize'
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

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
