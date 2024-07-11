import { useCallback } from 'react'

import {
  EditAccessType,
  editAccessConfirmationModalUISelectors
} from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Text,
  Flex
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

const { getType, getConfirmCallback, getCancelCallback } =
  editAccessConfirmationModalUISelectors

const messages = {
  title: 'Confirm Update',
  description: (type: EditAccessType) => {
    return type === 'visibility'
      ? ''
      : "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share."
  },
  cancel: 'Cancel',
  upload: (type: EditAccessType) => {
    return type === 'visibility' ? 'Change Visibility' : 'Update Audience'
  }
}

export const EditAccessConfirmationModal = () => {
  const type = useSelector(getType)
  const confirmCallback = useSelector(getConfirmCallback)
  const cancelCallback = useSelector(getCancelCallback)
  const [isOpen, setIsOpen] = useModalState('EditAccessConfirmation')

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  const handleCancel = useCallback(() => {
    cancelCallback()
    onClose()
  }, [cancelCallback, onClose])

  if (!type) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <Flex justifyContent='center'>
          <Text variant='body' size='l' textAlign='center'>
            {messages.description(type)}
          </Text>
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' fullWidth onClick={handleCancel}>
          {messages.cancel}
        </Button>
        <Button variant='primary' fullWidth onClick={handleConfirm}>
          {messages.upload(type)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
