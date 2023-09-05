import { StyleSheet, View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { useThemedStyles } from 'app/hooks/useThemedStyles'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileRoot } from './LineupTileRoot'
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

export const LineupTileSkeleton = () => {
  const trackTileStyles = useThemedStyles(createStyles)
  return (
    <LineupTileRoot>
      <View style={styles.metadata}>
        <View style={[trackTileStyles.imageContainer, trackTileStyles.image]}>
          <Skeleton style={trackTileStyles.image} />
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
        <LineupTileActionButtons disabled />
      </View>
    </LineupTileRoot>
  )
}
