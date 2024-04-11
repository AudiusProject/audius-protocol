import { useCallback } from 'react'

import { albumTrackRemoveConfirmationModalSelector } from '@audius/common/store'
import {
  Button,
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle,
  ModalFooter
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

const messages = {
  title: 'Remove Track',
  description1: 'Are you sure you want to remove this track from your album?',
  description2:
    'By default, fans who have purchased your album will still have access to your track.',
  cancel: 'Cancel',
  release: 'Remove Track From Album'
}

export const AlbumTrackRemoveConfirmationModal = () => {
  const { confirmCallback } = useSelector(
    albumTrackRemoveConfirmationModalSelector
  )
  const [isOpen, setIsOpen] = useModalState('AlbumTrackRemoveConfirmation')

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleConfirm = useCallback(() => {
    confirmCallback?.()
    onClose()
  }, [confirmCallback, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent css={{ textAlign: 'center' }}>
        <ModalContentText>{messages.description1}</ModalContentText>
        <ModalContentText>{messages.description2}</ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button fullWidth variant='secondary' onClick={onClose}>
          {messages.cancel}
        </Button>
        <Button variant='destructive' fullWidth onClick={handleConfirm}>
          {messages.release}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
