import type { Remix } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import CoSign, { Size } from 'app/components/co-sign'
import { makeStyles } from 'app/styles'

import { FadeInView } from '../core'

import { useStyles as useTrackTileStyles } from './styles'
import type { LineupTileProps } from './types'

const useStyles = makeStyles(({ palette }) => ({
  imageRoot: {
    position: 'relative'
  },
  image: {
    position: 'absolute'
  },
  backdrop: {
    position: 'absolute',
    backgroundColor: palette.skeleton
  }
}))

type LineupTileArtProps = {
  coSign?: Remix | null
  renderImage: LineupTileProps['renderImage']
  style?: StyleProp<ViewStyle>
}

export const LineupTileArt = (props: LineupTileArtProps) => {
  const { coSign, renderImage, style } = props
  const trackTileStyles = useTrackTileStyles()
  const styles = useStyles()

  const imageElement = (
    <View style={styles.imageRoot}>
      <View style={[trackTileStyles.image, styles.backdrop]} />
      <FadeInView style={styles.image} startOpacity={0} duration={500}>
        {renderImage({ style: trackTileStyles.image })}
      </FadeInView>
    </View>
  )

  return coSign ? (
    <CoSign size={Size.SMALL} style={[style, trackTileStyles.image]}>
      {imageElement}
    </CoSign>
  ) : (
    <View style={[style, trackTileStyles.image]}>{imageElement}</View>
  )
}
