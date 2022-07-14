import type { ID } from '@audius/common'
import {
  CoverArtSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { View } from 'react-native'

import IconPause from 'app/assets/images/pbIconPauseAlt.svg'
import IconPlay from 'app/assets/images/pbIconPlayAlt.svg'
import { DynamicImage } from 'app/components/core'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { makeStyles } from 'app/styles'

type ArtworkIconProps = {
  isLoading: boolean
  isPlaying: boolean
}

type TrackArtworkProps = {
  trackId: ID
  isLoading: boolean
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}

const useStyles = makeStyles(({ spacing }) => ({
  artworkContainer: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 52,
    height: 52,
    width: 52,
    marginRight: spacing(4),
    borderRadius: 4
  },
  artworkImage: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    borderRadius: 4
  },
  artwork: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  artworkIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4
  },
  artworkIconSvg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -spacing(4) }, { translateY: -spacing(4) }]
  }
}))

// TODO: Add loading animation
const ArtworkIcon = ({ isLoading, isPlaying }: ArtworkIconProps) => {
  const styles = useStyles()
  const Icon = isPlaying ? IconPause : IconPlay
  const artworkIcon = <Icon style={[styles.artworkIconSvg]} />

  return <View style={styles.artworkIcon}>{artworkIcon}</View>
}

export const TrackArtwork = ({
  trackId,
  isPlaying,
  isActive,
  isLoading,
  coverArtSizes
}: TrackArtworkProps) => {
  const styles = useStyles()
  const image = useTrackCoverArt({
    id: trackId,
    sizes: coverArtSizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <View style={styles.artworkContainer}>
      <View style={styles.artwork}>
        <DynamicImage uri={image} style={styles.artworkImage} />
        {isActive ? (
          <ArtworkIcon isLoading={isLoading} isPlaying={isPlaying} />
        ) : null}
      </View>
    </View>
  )
}
