import React, { useCallback } from 'react'

import { Modal, ModalContent, ModalHeader, ModalTitle } from '@audius/stems'

import IconGoldBadgeSrc from 'assets/img/tokenBadgeGold40@2x.png'
import { useModalState } from 'common/hooks/useModalState'

import styles from './BuyAudioModal.module.css'

const messages = {
  buyAudio: 'Buy Audio'
}

const IconGoldBadge = () => (
  <img
    draggable={false}
    src={IconGoldBadgeSrc}
    alt='Gold Badge Icon'
    width={24}
    height={24}
  />
)

export const BuyAudioModal = () => {
  const [isOpen, setIsOpen] = useModalState('BuyAudio')
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} bodyClassName={styles.modal}>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={messages.buyAudio} icon={<IconGoldBadge />} />
      </ModalHeader>
      <ModalContent className={styles.modalContent}></ModalContent>
    </Modal>
  )
}
