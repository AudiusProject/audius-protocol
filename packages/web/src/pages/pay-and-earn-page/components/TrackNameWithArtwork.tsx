import {
  useCurrentUserId,
  useGetPlaylistById,
  useTrack
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
  const { data: partialTrack, isPending: isTrackPending } = useTrack(id, {
    enabled: isTrack,
    select: (track) => ({
      title: track.title,
      owner_id: track.owner_id
    })
  })
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
  const title = isTrack ? partialTrack?.title : album?.playlist_name
  const image = isTrack ? trackArtwork : albumArtwork
  const loading = albumStatus !== Status.SUCCESS || isTrackPending

  return loading ? null : (
    <div className={styles.container}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text ellipses>{title}</Text>
    </div>
  )
}
