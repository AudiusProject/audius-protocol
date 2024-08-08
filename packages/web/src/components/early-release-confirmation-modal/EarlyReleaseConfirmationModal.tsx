import { useCallback } from 'react'

import { useEarlyReleaseConfirmationModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex,
  IconRocket
} from '@audius/harmony'

const getMessages = (contentType: 'track' | 'album') => ({
  title: 'Confirm Early Release',
  description: `Do you want to release your ${contentType} now? Your followers will be notified.`,
  cancel: 'Cancel',
  confirm: 'Release Now'
})

export const EarlyReleaseConfirmationModal = () => {
  const { data, isOpen, onClose } = useEarlyReleaseConfirmationModal()
  const { contentType, confirmCallback, cancelCallback } = data

  const messages = getMessages(contentType)

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  const handleCancel = useCallback(() => {
    cancelCallback?.()
    onClose()
  }, [cancelCallback, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <Flex alignSelf='center' gap='s'>
          <IconRocket color='default' size='l' />
          <Text variant='label' size='xl' strength='strong'>
            {messages.title}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex justifyContent='center'>
          <Text variant='body' size='l' textAlign='center'>
            {messages.description}
          </Text>
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' fullWidth onClick={handleCancel}>
          {messages.cancel}
        </Button>
        <Button variant='primary' fullWidth onClick={handleConfirm}>
          {messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
