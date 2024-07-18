import { useCallback } from 'react'

import { publishTrackConfirmationModalUISelectors } from '@audius/common/store'
import {
  Button,
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconRocket
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

const { getConfirmCallback } = publishTrackConfirmationModalUISelectors

const messages = {
  title: 'Confirm Release',
  description:
    'Are you sure you want to make this track public? Your followers will be notified.',
  cancel: 'Go Back',
  release: 'Release Now'
}

export const PublishTrackConfirmationModal = () => {
  const confirmCallback = useSelector(getConfirmCallback)
  const [isOpen, setIsOpen] = useModalState('PublishTrackConfirmation')

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle icon={<IconRocket />} title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText css={{ textAlign: 'center' }}>
          {messages.description}
        </ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button fullWidth variant='secondary' onClick={onClose}>
          {messages.cancel}
        </Button>
        <Button variant='primary' fullWidth onClick={handleConfirm}>
          {messages.release}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
