import { useGetPlaylistById } from '~/api'
import { ID, isContentUSDCPurchaseGated } from '~/models'
import { Nullable } from '~/utils'

import { LockedStatusVariant } from './types'

export const useCollectionLockedStatusVariant = (collectionId: ID) => {
  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )

  if (!collection) return null
  const { stream_conditions } = collection

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)

  let variant: Nullable<LockedStatusVariant> = null
  if (isPurchaseable) {
    variant = 'premium'
  }

  return variant
}
