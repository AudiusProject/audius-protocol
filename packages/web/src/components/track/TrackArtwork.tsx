import { ID, SquareSizes } from '@audius/common/models'
import { Artwork, ArtworkProps } from '@audius/harmony'

import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

type TrackArtworkProps = {
  trackId: ID
  size: SquareSizes
} & ArtworkProps

// TODO build this out and replace the existing TrackImage component
export const TrackArtwork = (props: TrackArtworkProps) => {
  const { trackId, size, ...other } = props
  const imageSource = useTrackCoverArt({ trackId, size })

  return <Artwork src={imageSource} {...other} />
}
