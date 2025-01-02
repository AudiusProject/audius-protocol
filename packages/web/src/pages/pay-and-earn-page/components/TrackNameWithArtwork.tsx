import {
  useCurrentUserId,
  useGetPlaylistById,
  useGetTrackById
} from '@audius/common/api'
import {
  SquareSizes,
  Status,
  USDCContentPurchaseType
} from '@audius/common/models'
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
  const { status: trackStatus, data: track } = useGetTrackById(
    { id },
    { disabled: !isTrack }
  )
  const { data: currentUserId } = useCurrentUserId()
  const { status: albumStatus, data: album } = useGetPlaylistById(
    { playlistId: id, currentUserId },
    { disabled: isTrack }
  )
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
  const loading = ![trackStatus, albumStatus].includes(Status.SUCCESS)

  return loading ? null : (
    <div className={styles.container}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text ellipses>{title}</Text>
    </div>
  )
}
