import { StyleSheet, View } from 'react-native'

import { ImageSkeleton } from 'app/components/image-skeleton'
import Skeleton from 'app/components/skeleton'
import { useThemedStyles } from 'app/hooks/useThemedStyles'

import { TrackTileActionButtons } from './TrackTileActionButtons'
import { TrackTileRoot } from './TrackTileRoot'
import { createStyles } from './styles'

const styles = StyleSheet.create({
  skeleton: {
    position: 'absolute',
    top: 0
  },
  metadata: {
    flexDirection: 'row'
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    width: '100%'
  }
})

export const TrackTileSkeleton = () => {
  const trackTileStyles = useThemedStyles(createStyles)
  return (
    <TrackTileRoot>
      <View style={styles.metadata}>
        <View style={[trackTileStyles.imageContainer, trackTileStyles.image]}>
          <ImageSkeleton styles={{ root: trackTileStyles.image }} />
        </View>

        <View style={[trackTileStyles.titles]}>
          <View style={trackTileStyles.title}>
            <Skeleton style={styles.skeleton} width='80%' height='80%' />
          </View>
          <View style={[trackTileStyles.artist, { width: '100%' }]}>
            <Skeleton style={styles.skeleton} width='60%' height='80%' />
          </View>
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <TrackTileActionButtons />
      </View>
    </TrackTileRoot>
  )
}
