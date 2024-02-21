import { useCallback } from 'react'

import { Modal, ModalContent, ModalHeader, ModalTitle } from '@audius/harmony'

import IconRaisedHand from 'assets/img/iconRaisedHand.svg'
import { useModalState } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './BuyAudioRecoveryModal.module.css'

const messages = {
  holdOn: 'Hold On',
  helpText:
    'Your purchase of $AUDIO was interrupted.\nGive us a moment while we finish things up.'
}

export const BuyAudioRecoveryModal = () => {
  const [isOpen, setIsOpen] = useModalState('BuyAudioRecovery')
  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.holdOn} icon={<IconRaisedHand />} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <LoadingSpinner className={styles.spinner} />
        <div className={styles.helpText}>{messages.helpText}</div>
      </ModalContent>
    </Modal>
  )
}
