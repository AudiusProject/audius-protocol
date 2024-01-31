import { useCallback } from 'react'

import { publishTrackConfirmationModalUISelectors } from '@audius/common/store'
import { IconRocket } from '@audius/harmony'
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

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'
import { Text } from 'components/typography'

import styles from '../upload-confirmation-modal/UploadConfirmationModal.module.css'

const { getConfirmCallback } = publishTrackConfirmationModalUISelectors

const messages = {
  title: 'Confirm Release',
  description:
    'Ready to release your new track? Your followers will be notified and your track will be released to the public.',
  cancel: 'Go Back',
  release: 'Release Now '
}

export const PublishTrackConfirmationModal = () => {
  const confirmCallback = useSelector(getConfirmCallback)
  const [isOpen, setIsOpen] = useModalState('PublishTrackConfirmation')

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
          icon={<IconRocket className={styles.titleIcon} />}
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
          {messages.description}
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
          text={messages.release}
          type={ButtonType.PRIMARY}
          onClick={handleConfirm}
        />
      </ModalFooter>
    </Modal>
  )
}
