import { useGetPlaylistById } from '~/api'
import { ID, isContentUSDCPurchaseGated } from '~/models'

export const useIsCollectionUnlockable = (collectionId: ID) => {
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId
  })

  if (!collection) return false
  const { stream_conditions } = collection
  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)

  return isPurchaseable
}
