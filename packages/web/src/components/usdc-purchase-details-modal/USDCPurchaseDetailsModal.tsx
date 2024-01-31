import { useUSDCPurchaseDetailsModal } from '@audius/common/store'

import { Modal } from '@audius/stems'

import { PurchaseModalContent } from './components/PurchaseModalContent'
import { SaleModalContent } from './components/SaleModalContent'

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
        <PurchaseModalContent
          purchaseDetails={purchaseDetails}
          onClose={onClose}
        />
      ) : (
        <SaleModalContent purchaseDetails={purchaseDetails} onClose={onClose} />
      )}
    </Modal>
  )
}
