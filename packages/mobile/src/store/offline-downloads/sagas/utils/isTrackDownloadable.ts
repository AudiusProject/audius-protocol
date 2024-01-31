import type { ID, UserTrackMetadata } from '@audius/common/models'

export const isTrackDownloadable = (
  track: UserTrackMetadata,
  currentUserId: ID
) => {
  const { is_available, is_delete, is_invalid, is_unlisted, user } = track
  const { user_id, is_deactivated } = user
  const isListed = !is_unlisted || user_id === currentUserId
  return (
    is_available && !is_delete && !is_invalid && isListed && !is_deactivated
  )
}
