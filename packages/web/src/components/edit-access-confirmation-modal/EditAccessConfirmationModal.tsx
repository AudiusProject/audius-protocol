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
import { capitalize } from 'lodash'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

const { getType, getConfirmCallback, getCancelCallback } =
  editAccessConfirmationModalUISelectors

const messages = {
  title: (type: EditAccessType) => {
    return `Confirm ${capitalize(type)}`
  },
  description: 'Some users may lose access.',
  cancel: 'Go Back',
  upload: 'Confirm'
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
        <ModalTitle title={messages.title(type)} />
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
          {messages.upload}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
