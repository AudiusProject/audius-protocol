import { useCollection } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

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
  const { data: album } = useCollection(contentId)
  const albumArtwork = useCollectionCoverArt({
    collectionId: contentId,
    size: SquareSizes.SIZE_150_BY_150
  })

  if (!album) return null

  return (
    <PurchaseModalContent
      purchaseDetails={purchaseDetails}
      contentLabel={messages.album}
      contentTitle={album.playlist_name}
      link={album.permalink ?? ''}
      artwork={albumArtwork}
      onClose={onClose}
    />
  )
}
