import { useCallback } from 'react'

import { useReplaceTrackConfirmationModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex,
  Hint,
  IconError
} from '@audius/harmony'

const messages = {
  title: 'Are You Sure?',
  description: 'Are you sure you want to replace the file for this track?',
  hintText:
    'This change may impact accuracy of comment timestamps. Social metrics such as reposts won’t be affected.',
  cancel: 'Cancel',
  confirm: 'Confirm & Replace'
}

export const ReplaceTrackConfirmationModal = () => {
  const { data, isOpen, onClose } = useReplaceTrackConfirmationModal()
  const { confirmCallback, cancelCallback } = data

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
        <Flex justifyContent='center' direction='column' gap='xl'>
          <Text variant='body' size='l'>
            {messages.description}
          </Text>
          <Hint pv='s' icon={IconError}>
            {messages.hintText}
          </Hint>
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
