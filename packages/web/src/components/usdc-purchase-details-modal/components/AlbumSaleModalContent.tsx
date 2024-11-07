import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useCollectionCoverArt3 } from 'hooks/useCollectionCoverArt'

import { SaleModalContent } from './SaleModalContent'

const messages = {
  album: 'Album'
}

export const AlbumSaleModalContent = ({
  purchaseDetails,
  onClose
}: {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}) => {
  const { contentId } = purchaseDetails
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: album } = useGetPlaylistById({
    playlistId: contentId,
    currentUserId
  })
  const albumArtwork = useCollectionCoverArt3({
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
