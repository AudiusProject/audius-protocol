import { useGetTrackById } from '@audius/common/api'
import { SquareSizes, USDCPurchaseDetails } from '@audius/common/models'

import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import { PurchaseModalContent } from './PurchaseModalContent'

const messages = {
  track: 'Track'
}

export const TrackPurchaseModalContent = ({
  purchaseDetails,
  onClose
}: {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}) => {
  const { contentId } = purchaseDetails
  const { data: track } = useGetTrackById({ id: contentId })
  const trackArtwork = useTrackCoverArt({
    trackId: contentId,
    size: SquareSizes.SIZE_150_BY_150
  })

  if (!track) return null
  return (
    <PurchaseModalContent
      purchaseDetails={purchaseDetails}
      contentLabel={messages.track}
      contentTitle={track.title}
      link={track.permalink}
      artwork={trackArtwork}
      onClose={onClose}
    />
  )
}
