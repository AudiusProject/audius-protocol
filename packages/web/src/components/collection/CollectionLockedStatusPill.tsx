import { useGetPlaylistById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  Collection,
  ID,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'

import {
  LockedStatusPill,
  LockedStatusPillProps
} from 'components/locked-status-pill'

type CollectionLockedStatusPillProps = {
  collectionId: ID
}

export const CollectionLockedStatusPill = (
  props: CollectionLockedStatusPillProps
) => {
  const { collectionId } = props
  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )

  const { hasStreamAccess } = useGatedContentAccess(
    collection as Nullable<Collection>
  )

  if (!collection) return null
  const { stream_conditions } = collection

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)

  let variant: Nullable<LockedStatusPillProps['variant']> = null
  if (isPurchaseable) {
    variant = 'premium'
  }

  if (!variant) return null

  return <LockedStatusPill variant={variant} locked={!hasStreamAccess} />
}

export const useIsCollectionUnlockable = (collectionId: ID) => {
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId
  })

  if (!collection) return false
  const { stream_conditions } = collection
  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)

  return isPurchaseable
}
