import { View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  trackContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    justifyContent: 'center'
  },
  trackTitle: { height: spacing(4), marginBottom: 2 },
  trackArtist: { height: spacing(4) }
}))

export const TrackListItemSkeleton = () => {
  const styles = useStyles()

  return (
    <View>
      <View style={styles.trackContainer}>
        <Skeleton style={styles.trackTitle} width='54%' />
        <Skeleton style={styles.trackArtist} width='30%' />
      </View>
    </View>
  )
}
