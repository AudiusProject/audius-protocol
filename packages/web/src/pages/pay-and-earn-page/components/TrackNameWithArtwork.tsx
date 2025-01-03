import { useCollection, useTrack } from '@audius/common/api'
import { SquareSizes, USDCContentPurchaseType } from '@audius/common/models'
import { Text } from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './TrackNameWithArtwork.module.css'

export const TrackNameWithArtwork = ({
  id,
  contentType
}: {
  id: number
  contentType: USDCContentPurchaseType
}) => {
  const isTrack = contentType === USDCContentPurchaseType.TRACK
  const { isPending: isTrackPending, data: track } = useTrack(id)
  const { isPending: isAlbumPending, data: album } = useCollection(id, {
    enabled: !isTrack
  })
  const trackArtwork = useTrackCoverArt({
    trackId: id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const albumArtwork = useCollectionCoverArt({
    collectionId: id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const title = isTrack ? track?.title : album?.playlist_name
  const image = isTrack ? trackArtwork : albumArtwork
  const loading = isTrackPending || isAlbumPending

  return loading ? null : (
    <div className={styles.container}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text ellipses>{title}</Text>
    </div>
  )
}
