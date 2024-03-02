import { useCallback } from 'react'

import { Collection } from '@audius/common/models'
import {
  cacheCollectionsActions,
  collectionPageSelectors,
  CommonState
} from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle,
  ModalProps,
  ModalFooter,
  IconRocket,
  Button
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PublishConfirmationModal.module.css'
const { getCollection } = collectionPageSelectors

const { publishPlaylist } = cacheCollectionsActions

const messages = {
  title: 'Make Public',
  description: (collectionType: 'album' | 'playlist') =>
    `Are you sure you want to make this ${collectionType} public? It will be shared to your feed and your subscribed followers will be notified.`,
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

  const { is_album } = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection

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
        <ModalContentText>
          {messages.description(is_album ? 'album' : 'playlist')}
        </ModalContentText>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.cancel}
        </Button>
        <Button
          variant='primary'
          iconLeft={IconRocket}
          onClick={handlePublish}
          fullWidth
        >
          {messages.publish}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
