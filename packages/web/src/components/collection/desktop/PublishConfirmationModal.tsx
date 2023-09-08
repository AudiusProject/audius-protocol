import { useCallback } from 'react'

import { cacheCollectionsActions } from '@audius/common'
import {
  Button,
  ButtonType,
  IconRocket,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalProps,
  ModalTitle
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import styles from './PublishConfirmationModalFooter.module.css'

const { publishPlaylist } = cacheCollectionsActions

const messages = {
  title: 'Make Public',
  description:
    'Are you sure you want to make this playlist public? It will be shared to your feed and your subscribed followers will be notified.',
  cancel: 'Cancel',
  publish: 'Make Public'
}

type PublishConfirmationModalProps = Omit<ModalProps, 'children'> & {
  collectionId: number
}

export const PublishConfirmationModal = (
  props: PublishConfirmationModalProps
) => {
  const { collectionId, ...other } = props
  const { onClose } = other
  const dispatch = useDispatch()

  const handlePublish = useCallback(() => {
    dispatch(publishPlaylist(collectionId))
    onClose()
  }, [dispatch, collectionId, onClose])

  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconRocket />} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>{messages.description}</ModalContentText>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          fullWidth
          text={messages.cancel}
          type={ButtonType.COMMON}
          onClick={onClose}
        />
        <Button
          fullWidth
          text={messages.publish}
          leftIcon={<IconRocket />}
          type={ButtonType.PRIMARY}
          onClick={handlePublish}
        />
      </ModalFooter>
    </Modal>
  )
}
