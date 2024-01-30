import { Variant, Collection, SmartCollection } from '@audius/common/models'
import {} from '@audius/common'

export const computeCollectionMetadataProps = (
  metadata: Collection | SmartCollection | null
) => {
  const trackCount =
    metadata && metadata.playlist_contents
      ? metadata.playlist_contents.track_ids.length
      : 0
  const isEmpty = metadata && trackCount === 0
  const lastModified =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.updated_at || Date.now()
      : ''
  const playlistName = metadata ? metadata.playlist_name : ''
  const description =
    metadata && metadata.description ? metadata.description : ''
  const isPrivate =
    metadata && metadata.variant !== Variant.SMART ? metadata.is_private : false
  const isAlbum =
    metadata && metadata.variant !== Variant.SMART ? metadata.is_album : false
  const isPublishing =
    metadata && metadata.variant !== Variant.SMART
      ? metadata._is_publishing
      : false
  const playlistSaveCount =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.save_count || 0
      : 0
  const playlistRepostCount =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.repost_count || 0
      : 0
  const isReposted =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.has_current_user_reposted
      : false

  return {
    trackCount,
    isEmpty,
    lastModified,
    playlistName,
    description,
    isPrivate,
    isAlbum,
    isPublishing,
    playlistSaveCount,
    playlistRepostCount,
    isReposted
  }
}
