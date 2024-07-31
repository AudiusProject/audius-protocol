import { useCallback } from 'react'

import {
  EditAccessType,
  useEditAccessConfirmationModal
} from '@audius/common/store'
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

const getMessages = (type: EditAccessType | null) => ({
  title:
    type === 'audience' || type === 'hidden'
      ? 'Confirm Update'
      : type === 'early_release'
      ? 'Confirm Early Release'
      : 'Confirm Release',
  description:
    type === 'audience'
      ? "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share."
      : type === 'hidden'
      ? "You're about to make your content hidden.  This update may cause others to lose the ability to listen and share."
      : type === 'early_release'
      ? 'Do you want to release your track now? Your followers will be notified.'
      : 'Are you sure you want to make this track public? Your followers will be notified.',
  cancel: 'Cancel',
  confirm:
    type === 'audience'
      ? 'Update Audience'
      : type === 'release' || type === 'early_release'
      ? 'Release Now'
      : 'Hide Track'
})

export const EditAccessConfirmationModal = () => {
  const { data, isOpen, onClose } = useEditAccessConfirmationModal()
  const { type, confirmCallback, cancelCallback } = data
  const messages = getMessages(type)

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
        <Flex alignSelf='center' gap='s'>
          {type === 'release' || type === 'early_release' ? (
            <IconRocket color='default' size='l' />
          ) : null}
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
