import { useCallback } from 'react'

import {
  EditPlaylistValues,
  cacheCollectionsActions
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
import { useDispatch } from 'react-redux'

import styles from './PublishConfirmationModal.module.css'

const { editPlaylist } = cacheCollectionsActions

const messages = {
  title: 'Release Now',
  description: (collectionType: 'album' | 'playlist') =>
    `Are you sure you want to release this ${collectionType}? It will be shared to your feed and your subscribed followers will be notified.`,
  descriptionHiddenAlbum:
    'Are you sure you want to release this album? Any hidden track in the album will become public. It will be shared to your feed and your subscribed followers will be notified.',
  cancel: 'Cancel',
  publish: 'Release Now'
}

type PublishConfirmationModalProps = Omit<ModalProps, 'children'> & {
  isAlbum?: boolean
  isPrivate?: boolean
  collectionFormValues: EditPlaylistValues
  onSubmit: () => void
}

export const PublishConfirmationModal = (
  props: PublishConfirmationModalProps
) => {
  const { isAlbum, collectionFormValues, ...other } = props
  const { is_private } = collectionFormValues
  const { onClose, onSubmit } = other
  const dispatch = useDispatch()

  const handlePublish = useCallback(() => {
    console.log({
      streamConditions: collectionFormValues.stream_conditions,
      // downloadConditions: collectionFormValues.download_conditions,
      is_stream_gated: collectionFormValues.is_stream_gated,
      is_private: collectionFormValues.is_private,
      form: collectionFormValues
    })
    dispatch(
      editPlaylist(collectionFormValues.playlist_id, collectionFormValues)
    )
    onSubmit()
  }, [collectionFormValues, dispatch, onSubmit])

  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconRocket />} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>
          {isAlbum && is_private
            ? messages.descriptionHiddenAlbum
            : messages.description(isAlbum ? 'album' : 'playlist')}
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
