import type { Track } from '@audius/common'
import { SquareSizes } from '@audius/common'
import { View } from 'react-native'

import IconPause from 'app/assets/images/pbIconPauseAlt.svg'
import IconPlay from 'app/assets/images/pbIconPlayAlt.svg'
import { TrackImage } from 'app/components/image/TrackImage'
import { makeStyles } from 'app/styles'

type TrackArtworkProps = {
  track: Track
  isActive?: boolean
  isPlaying: boolean
}

const useStyles = makeStyles(({ spacing }) => ({
  image: {
    borderRadius: 4,
    height: 52,
    width: 52,
    marginRight: spacing(4)
  },
  artworkIcon: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.4)'
  }
}))

export const TrackArtwork = (props: TrackArtworkProps) => {
  const { isPlaying, isActive, track } = props
  const styles = useStyles()

  const ActiveIcon = isPlaying ? IconPause : IconPlay

  return (
    <TrackImage
      track={track}
      size={SquareSizes.SIZE_150_BY_150}
      style={styles.image}
    >
      {isActive ? (
        <View style={styles.artworkIcon}>
          <ActiveIcon />
        </View>
      ) : null}
    </TrackImage>
  )
}
