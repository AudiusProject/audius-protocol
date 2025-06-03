import { useCallback } from 'react'

import { useFinalizeWinnersConfirmationModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex
} from '@audius/harmony'

const messages = {
  title: 'Confirm Winners?',
  description: 'Are you sure you want to finalize your winners?',
  description2: 'All participants will be notified.',
  cancel: 'Go Back',
  confirm: 'Confirm'
}

export const FinalizeWinnersConfirmationModal = () => {
  const { data, isOpen, onClose } = useFinalizeWinnersConfirmationModal()
  const { confirmCallback, cancelCallback, isInitialSave } = data

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
          <Text variant='label' size='xl' strength='strong'>
            {messages.title}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex column justifyContent='center' gap='xl'>
          <Text variant='body' size='l'>
            {messages.description}
            {isInitialSave ? ` ${messages.description2}` : ''}
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
