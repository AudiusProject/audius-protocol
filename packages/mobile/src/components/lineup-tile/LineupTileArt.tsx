import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import TrackFlair, { Size } from 'app/components/track-flair'
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
  renderImage: LineupTileProps['renderImage']
  style?: StyleProp<ViewStyle>
  trackId: number
}

export const LineupTileArt = (props: LineupTileArtProps) => {
  const { renderImage, style, trackId } = props
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

  return (
    <TrackFlair
      trackId={trackId}
      size={Size.SMALL}
      style={[style, trackTileStyles.image]}
    >
      {imageElement}
    </TrackFlair>
  )
}
