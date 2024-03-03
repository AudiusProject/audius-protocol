import { useCallback } from 'react'

import { uploadConfirmationModalUISelectors } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconCloudUpload as IconUpload,
  Button
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

const { getConfirmCallback, getHasPublicTracks } =
  uploadConfirmationModalUISelectors

const messages = {
  title: 'Confirm Upload',
  publicDescription:
    'Ready to begin uploading? Your followers will be notified once your upload is complete.',
  hiddenDescription: 'Ready to begin uploading?',
  cancel: 'Go Back',
  upload: 'Upload'
}

export const UploadConfirmationModal = () => {
  const confirmCallback = useSelector(getConfirmCallback)
  const hasPublicTracks = useSelector(getHasPublicTracks)
  const [isOpen, setIsOpen] = useModalState('UploadConfirmation')

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
        <ModalTitle icon={<IconUpload />} title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>
          {hasPublicTracks
            ? messages.publicDescription
            : messages.hiddenDescription}
        </ModalContentText>
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
