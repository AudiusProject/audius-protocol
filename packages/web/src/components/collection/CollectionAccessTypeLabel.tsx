import { useCollectionAccessTypeLabel } from '@audius/common/hooks'
import { ID } from '@audius/common/models'

import { AccessTypeLabel } from 'components/access-type-label'

type CollectionAccessTypeLabelProps = { collectionId: ID }

export const CollectionAccessTypeLabel = (
  props: CollectionAccessTypeLabelProps
) => {
  const { collectionId } = props
  const { type, scheduledReleaseDate } =
    useCollectionAccessTypeLabel(collectionId)

  if (!type) return null

  return (
    <AccessTypeLabel type={type} scheduledReleaseDate={scheduledReleaseDate} />
  )
}
