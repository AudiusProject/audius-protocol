import type { UserCollectionMetadata, ID } from '@audius/common/models'

export const isCollectionDownloadable = (
  collection: UserCollectionMetadata,
  currentUserId: ID
) => {
  const { is_delete, is_private, user } = collection
  const { user_id, is_deactivated } = user
  const isListed = !is_private || (is_private && user_id === currentUserId)

  return !is_delete && isListed && !is_deactivated
}
