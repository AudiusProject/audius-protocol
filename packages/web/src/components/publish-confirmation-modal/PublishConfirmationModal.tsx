import { useCallback } from 'react'

import { usePublishConfirmationModal } from '@audius/common/store'
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

const getMessages = (contentType: 'track' | 'album' | 'playlist') => ({
  title: 'Confirm Release',
  description: `Are you sure you want to make this ${contentType} public? Your followers will be notified.`,
  cancel: 'Go Back',
  release: 'Release Now'
})

export const PublishConfirmationModal = () => {
  const { data, isOpen, onClose } = usePublishConfirmationModal()
  const { contentType, confirmCallback } = data

  const messages = getMessages(contentType)

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
