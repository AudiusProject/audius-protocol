import { useTrack } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import { SaleModalContent } from './SaleModalContent'

const messages = {
  track: 'Track Purchased'
}

export const TrackSaleModalContent = ({
  purchaseDetails,
  onClose
}: {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}) => {
  const { contentId } = purchaseDetails
  const { data: track } = useTrack(contentId)
  const trackArtwork = useTrackCoverArt({
    trackId: contentId,
    size: SquareSizes.SIZE_150_BY_150
  })

  if (!track) return null

  return (
    <SaleModalContent
      purchaseDetails={purchaseDetails}
      contentLabel={messages.track}
      contentTitle={track?.title}
      link={track.permalink}
      artwork={trackArtwork}
      onClose={onClose}
    />
  )
}
