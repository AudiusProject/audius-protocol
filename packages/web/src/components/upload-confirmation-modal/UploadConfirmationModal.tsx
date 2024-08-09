import { useCallback } from 'react'

import { useUploadConfirmationModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconCloudUpload as IconUpload,
  Button,
  Text,
  Flex
} from '@audius/harmony'

const messages = {
  title: 'Confirm Upload',
  publicDescription:
    'Ready to begin uploading? Your followers will be notified once your upload is complete.',
  hiddenDescription: 'Ready to begin uploading?',
  cancel: 'Go Back',
  upload: 'Upload'
}

export const UploadConfirmationModal = () => {
  const { data, isOpen, onClose } = useUploadConfirmationModal()
  const { confirmCallback, hasPublicTracks } = data

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle icon={<IconUpload />} title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <Flex justifyContent='center'>
          <Text variant='body' size='l' textAlign='center'>
            {hasPublicTracks
              ? messages.publicDescription
              : messages.hiddenDescription}
          </Text>
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' fullWidth onClick={onClose}>
          {messages.cancel}
        </Button>
        <Button variant='primary' fullWidth onClick={handleConfirm}>
          {messages.upload}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
