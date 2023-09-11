import {
  USDCPurchaseDetails,
  useUSDCPurchaseDetailsModal
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyButtonType,
  IconArrow,
  IconCart,
  IconMessage,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'

import { Icon } from 'components/Icon'
import { DynamicTrackArtwork } from 'components/track/DynamicTrackArtwork'

import styles from './USDCPurchaseDetailsModal.module.css'

const messages = {
  by: 'By',
  cost: 'Cost',
  date: 'Date',
  done: 'Done',
  messageBuyer: 'Message Buyer',
  purchasedBy: 'Purchased By',
  purchaseDetails: 'Purchase Details',
  saleDetails: 'Sale Details',
  track: 'Track',
  trackPurchased: 'Track Purchased',
  visitTrack: 'Visit Track'
}

type ContentProps = {
  purchaseDetails: USDCPurchaseDetails
  onClose: () => void
}

const PurchaseModalContent = ({ purchaseDetails, onClose }: ContentProps) => {
  const onClickVisitTrack = () => {}
  return (
    <>
      <ModalHeader>
        <ModalTitle
          iconClassName={styles.icon}
          icon={<Icon icon={IconCart} />}
          title={messages.purchaseDetails}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div className={styles.trackRow}>
          <div className={styles.detailSection}></div>
          <DynamicTrackArtwork id={purchaseDetails.contentId} />
        </div>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <HarmonyButton
          className={styles.button}
          variant={HarmonyButtonType.GHOST}
          text={messages.visitTrack}
          iconRight={IconArrow}
          onClick={onClickVisitTrack}
        />
        <HarmonyButton
          className={styles.button}
          text={messages.done}
          onClick={onClose}
        />
      </ModalFooter>
    </>
  )
}
const SaleModalContent = ({ purchaseDetails, onClose }: ContentProps) => {
  const onClickMessageBuyer = () => {}
  return (
    <>
      <ModalHeader>
        <ModalTitle
          iconClassName={styles.icon}
          icon={<Icon icon={IconCart} />}
          title={messages.purchaseDetails}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>{/* TODO */}</ModalContent>
      <ModalFooter className={styles.footer}>
        <HarmonyButton
          className={styles.button}
          iconLeft={IconMessage}
          variant={HarmonyButtonType.GHOST}
          text={messages.messageBuyer}
          onClick={onClickMessageBuyer}
        />
        <HarmonyButton
          className={styles.button}
          text={messages.done}
          onClick={onClose}
        />
      </ModalFooter>
    </>
  )
}

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
    <Modal
      bodyClassName={styles.modalBody}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      size={'small'}
    >
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
