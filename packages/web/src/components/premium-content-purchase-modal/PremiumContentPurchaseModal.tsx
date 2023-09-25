import {
  useGetTrackById,
  usePremiumContentPurchaseModal,
  useUSDCBalance
} from '@audius/common'
import { IconCart, Modal, ModalContent, ModalHeader } from '@audius/stems'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseContentForm } from './components/PurchaseContentForm'

const messages = {
  completePurchase: 'Complete Purchase'
}

export const PremiumContentPurchaseModal = () => {
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()

  const { data: balance } = useUSDCBalance()
  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      bodyClassName={styles.modal}
      dismissOnClickOutside
    >
      <ModalHeader onClose={onClose} showDismissButton>
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          <Icon size='large' icon={IconCart} />
          {messages.completePurchase}
        </Text>
      </ModalHeader>
      <ModalContent>
        {track ? (
          <PurchaseContentForm
            track={track}
            currentBalance={balance}
            onViewTrackClicked={onClose}
          />
        ) : null}
      </ModalContent>
    </Modal>
  )
}
