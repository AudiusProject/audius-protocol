import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useCollectionCoverArt2 } from 'hooks/useCollectionCoverArt'

import { PurchaseModalContent } from './PurchaseModalContent'

const messages = {
  album: 'Album'
}

export const AlbumPurchaseModalContent = ({
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
  const albumArtwork = useCollectionCoverArt2(
    contentId,
    SquareSizes.SIZE_150_BY_150
  )

  if (!album || !album.permalink) return null

  return (
    <PurchaseModalContent
      purchaseDetails={purchaseDetails}
      contentLabel={messages.album}
      contentTitle={album.playlist_name}
      link={album.permalink}
      artwork={albumArtwork}
      onClose={onClose}
    />
  )
}
