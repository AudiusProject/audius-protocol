import { useCallback } from 'react'

import {
  combineStatuses,
  premiumContentSelectors,
  purchaseContentActions,
  statusIsNotFinalized,
  useGetTrackById,
  useUSDCBalance
} from '@audius/common'
import { IconCart, Modal, ModalContentPages, ModalHeader } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import styles from './PremiumContentPurchaseModal.module.css'
import { LoadingPage } from './components/LoadingPage'
import { PurchaseDetailsPage } from './components/PurchaseDetailsPage'

const { getPurchaseContentId } = premiumContentSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}

enum PurchaseSteps {
  LOADING = 0,
  DETAILS = 1
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

  const currentStep = statusIsNotFinalized(status)
    ? PurchaseSteps.LOADING
    : PurchaseSteps.DETAILS

  return { isOpen, handleClose, currentStep, track, balance, status }
}

export const PremiumContentPurchaseModal = () => {
  const { balance, isOpen, handleClose, currentStep, track } =
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
          color='--neutral-light-2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          <Icon size='large' icon={IconCart} />
          {messages.completePurchase}
        </Text>
      </ModalHeader>
      {track ? (
        <ModalContentPages currentPage={currentStep}>
          <LoadingPage />
          <PurchaseDetailsPage
            track={track}
            currentBalance={balance}
            onViewTrackClicked={handleClose}
          />
        </ModalContentPages>
      ) : null}
    </Modal>
  )
}
