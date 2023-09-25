import { useCallback, useEffect, useState } from 'react'

import {
  useGetTrackById,
  usePremiumContentPurchaseModal,
  useUSDCBalance,
  buyUSDCActions,
  buyUSDCSelectors
} from '@audius/common'
import { IconCart, Modal, ModalContent, ModalHeader } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseContentForm } from './components/PurchaseContentForm'

const { startRecoveryIfNecessary, recoveryStatusChanged } = buyUSDCActions
const { getRecoveryStatus } = buyUSDCSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}

export const PremiumContentPurchaseModal = () => {
  const dispatch = useDispatch()
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()

  const { data: balance, refresh } = useUSDCBalance()
  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const [shouldAttemptRecovery, setShouldAttemptRecovery] = useState(true)
  const recoveryStatus = useSelector(getRecoveryStatus)

  useEffect(() => {
    if (trackId && shouldAttemptRecovery) {
      dispatch(startRecoveryIfNecessary)
      setShouldAttemptRecovery(false)
    }
  }, [trackId, shouldAttemptRecovery, dispatch])

  useEffect(() => {
    if (recoveryStatus === 'success') {
      refresh()
    }
  }, [recoveryStatus, refresh])

  const handleClose = useCallback(() => {
    dispatch(recoveryStatusChanged({ status: 'idle' }))
    onClose()
  }, [dispatch, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
