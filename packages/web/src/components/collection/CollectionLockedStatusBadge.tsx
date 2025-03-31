import {
  useCollectionLockedStatusVariant,
  useGatedCollectionAccess
} from '@audius/common/hooks'
import { ID } from '@audius/common/models'

import { LockedStatusBadge } from 'components/locked-status-badge'

type CollectionLockedStatusBadgeProps = {
  collectionId: ID
}

export const CollectionLockedStatusBadge = (
  props: CollectionLockedStatusBadgeProps
) => {
  const { collectionId } = props
  const { hasStreamAccess } = useGatedCollectionAccess(collectionId)

  const variant = useCollectionLockedStatusVariant(collectionId)
  if (!variant) return null

  return <LockedStatusBadge variant={variant} locked={!hasStreamAccess} />
}
