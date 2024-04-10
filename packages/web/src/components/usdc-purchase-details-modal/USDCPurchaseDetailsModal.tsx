import { USDCContentPurchaseType } from '@audius/common/models'
import { useUSDCPurchaseDetailsModal } from '@audius/common/store'
import { Modal } from '@audius/harmony'

import { AlbumPurchaseModalContent } from './components/AlbumPurchaseModalContent'
import { SaleModalContent } from './components/SaleModalContent'
import { TrackPurchaseModalContent } from './components/TrackPurchaseModalContent'

export const USDCPurchaseDetailsModal = () => {
  const { isOpen, data, onClose, onClosed } = useUSDCPurchaseDetailsModal()
  const { variant, purchaseDetails } = data

  if (!purchaseDetails) {
    console.error(
      `USDCPurchaseDetailsModal (${variant}) rendered with empty purchase details`
    )
    return null
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size={'small'}>
      {variant === 'purchase' ? (
        purchaseDetails.contentType === USDCContentPurchaseType.TRACK ? (
          <TrackPurchaseModalContent
            purchaseDetails={purchaseDetails}
            onClose={onClose}
          />
        ) : (
          <AlbumPurchaseModalContent
            purchaseDetails={purchaseDetails}
            onClose={onClose}
          />
        )
      ) : (
        <SaleModalContent purchaseDetails={purchaseDetails} onClose={onClose} />
      )}
    </Modal>
  )
}
