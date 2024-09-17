import { useCallback } from 'react'

import { useConfirmationModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex
} from '@audius/harmony'

export const ConfirmationModal = () => {
  const { data, isOpen, onClose } = useConfirmationModal()
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
            {data.messages.title}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex justifyContent='center'>
          <Text variant='body' size='l' textAlign='center'>
            {data.messages.body}
          </Text>
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' fullWidth onClick={handleCancel}>
          {data.messages.cancel}
        </Button>
        <Button
          variant={data.confirmButtonType}
          fullWidth
          onClick={handleConfirm}
        >
          {data.messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
