import { useCallback } from 'react'

import { uploadConfirmationModalUISelectors } from '@audius/common'
import {
  Button,
  ButtonType,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { IconCloudUpload as IconUpload } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'
import { Text } from 'components/typography'

import styles from './UploadConfirmationModal.module.css'

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
        <ModalTitle
          icon={<IconUpload className={styles.titleIcon} />}
          title={
            <Text
              variant='label'
              size='xLarge'
              strength='strong'
              color='neutralLight2'
            >
              {messages.title}
            </Text>
          }
        />
      </ModalHeader>
      <ModalContent>
        <ModalContentText className={styles.modalText}>
          {hasPublicTracks
            ? messages.publicDescription
            : messages.hiddenDescription}
        </ModalContentText>
      </ModalContent>
      <ModalFooter className={styles.modalFooter}>
        <Button
          textClassName={styles.modalButton}
          fullWidth
          text={messages.cancel}
          type={ButtonType.COMMON}
          onClick={onClose}
        />
        <Button
          textClassName={styles.modalButton}
          fullWidth
          text={messages.upload}
          type={ButtonType.PRIMARY}
          onClick={handleConfirm}
        />
      </ModalFooter>
    </Modal>
  )
}
