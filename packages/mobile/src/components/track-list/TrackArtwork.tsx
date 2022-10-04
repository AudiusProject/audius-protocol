import type { ID, CoverArtSizes } from '@audius/common'
import { SquareSizes } from '@audius/common'
import { View } from 'react-native'

import IconPause from 'app/assets/images/pbIconPauseAlt.svg'
import IconPlay from 'app/assets/images/pbIconPlayAlt.svg'
import { DynamicImage } from 'app/components/core'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { makeStyles } from 'app/styles'

type TrackArtworkProps = {
  trackId: ID
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}

const useStyles = makeStyles(({ spacing }) => ({
  artworkContainer: {
    height: 52,
    width: 52,
    marginRight: spacing(4)
  },
  image: {
    borderRadius: 4
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
  const { trackId, isPlaying, isActive, coverArtSizes } = props
  const styles = useStyles()
  const image = useTrackCoverArt({
    id: trackId,
    sizes: coverArtSizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const ActiveIcon = isPlaying ? IconPause : IconPlay

  return (
    <DynamicImage
      uri={image}
      styles={{ root: styles.artworkContainer, image: styles.image }}
    >
      {isActive ? (
        <View style={styles.artworkIcon}>
          <ActiveIcon />
        </View>
      ) : null}
    </DynamicImage>
  )
}
