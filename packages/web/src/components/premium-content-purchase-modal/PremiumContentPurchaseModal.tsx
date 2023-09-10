import { useCallback } from 'react'

import {
  combineStatuses,
  premiumContentSelectors,
  purchaseContentActions,
  useGetTrackById,
  useUSDCBalance
} from '@audius/common'
import { IconCart, Modal, ModalContent, ModalHeader } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseDetailsPage } from './components/PurchaseDetailsPage'

const { getPurchaseContentId } = premiumContentSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}

const usePremiumContentPurchaseModalState = () => {
  const trackId = useSelector(getPurchaseContentId)
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useModalState('PremiumContentPurchase')
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const { data: track, status: trackStatus } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const status = combineStatuses([balanceStatus, trackStatus])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    dispatch(purchaseContentActions.cleanup())
  }, [setIsOpen, dispatch])

  return { isOpen, handleClose, track, balance, status }
}

export const PremiumContentPurchaseModal = () => {
  const { balance, isOpen, handleClose, track } =
    usePremiumContentPurchaseModalState()

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      bodyClassName={styles.modal}
      dismissOnClickOutside
    >
      <ModalHeader onClose={handleClose} showDismissButton>
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
          <PurchaseDetailsPage
            track={track}
            currentBalance={balance}
            onViewTrackClicked={handleClose}
          />
        ) : null}
      </ModalContent>
    </Modal>
  )
}
