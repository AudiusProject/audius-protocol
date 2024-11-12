import { useGetPlaylistById } from '@audius/common/api'
import {
  useCollectionLockedStatusVariant,
  useGatedContentAccess
} from '@audius/common/hooks'
import type { Collection, ID } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'

import { LockedStatusBadge } from '../core/LockedStatusBadge'

type CollectionLockedStatusBadgeProps = {
  collectionId: ID
}

export const CollectionLockedStatusBadge = (
  props: CollectionLockedStatusBadgeProps
) => {
  const { collectionId } = props
  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )

  const { hasStreamAccess } = useGatedContentAccess(
    collection as Nullable<Collection>
  )
  const variant = useCollectionLockedStatusVariant(collectionId)

  if (!variant) return null

  return <LockedStatusBadge variant={variant} locked={!hasStreamAccess} />
}
