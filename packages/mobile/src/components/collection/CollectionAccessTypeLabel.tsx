import { useCollectionAccessTypeLabel } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'

import { AccessTypeLabel } from '../core/AccessTypeLabel'

type CollectionAccessTypeLabelProps = {
  collectionId: ID
}

export const CollectionAccessTypeLabel = (
  props: CollectionAccessTypeLabelProps
) => {
  const { collectionId } = props
  const { type, scheduledReleaseDate, isUnlocked } =
    useCollectionAccessTypeLabel(collectionId)

  if (!type) return null

  return (
    <AccessTypeLabel
      type={type}
      scheduledReleaseDate={scheduledReleaseDate}
      isUnlocked={isUnlocked}
    />
  )
}
