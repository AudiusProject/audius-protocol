import { useCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

import { SaleModalContent } from './SaleModalContent'

const messages = {
  album: 'Album Purchased'
}

export const AlbumSaleModalContent = ({
  purchaseDetails,
  onClose
}: {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}) => {
  const { contentId } = purchaseDetails
  const { data: currentUserId } = useCurrentUserId()
  const { data: album } = useGetPlaylistById({
    playlistId: contentId,
    currentUserId
  })
  const albumArtwork = useCollectionCoverArt({
    collectionId: contentId,
    size: SquareSizes.SIZE_150_BY_150
  })

  if (!album) return null

  return (
    <SaleModalContent
      purchaseDetails={purchaseDetails}
      contentLabel={messages.album}
      contentTitle={album.playlist_name}
      link={album.permalink ?? ''}
      artwork={albumArtwork}
      onClose={onClose}
    />
  )
}
