import { useCallback, useEffect, useState } from 'react'

import { Name } from '@audius/common/models'
import {
  EditPlaylistValues,
  accountActions,
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  useEditPlaylistModal
} from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconPlaylists
} from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import PlaylistForm, {
  EditPlaylistValues as PlaylistFormValues
} from 'components/create-playlist/PlaylistForm'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { DeleteCollectionConfirmationModal } from 'components/nav/desktop/PlaylistLibrary/DeleteCollectionConfirmationModal'
import { track } from 'services/analytics'
import { useSelector } from 'utils/reducer'
import { TRENDING_PAGE } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './EditCollectionModal.module.css'
const { editPlaylist } = cacheCollectionsActions
const { getCollectionWithUser } = cacheCollectionsSelectors
const { fetchSavedPlaylists } = accountActions

const messages = {
  edit: 'Edit',
  delete: 'Delete',
  title: {
    playlist: 'Playlist',
    album: 'Album'
  },
  type: {
    playlist: 'Playlist',
    album: 'Album'
  }
}

const EditCollectionModal = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose, data } = useEditPlaylistModal()
  const { collectionId, isCollectionViewed } = data
  const collection = useSelector((state) =>
    getCollectionWithUser(state, { id: collectionId ?? undefined })
  )

  useEffect(() => {
    if (collection == null && collectionId != null) {
      dispatch(fetchSavedPlaylists())
    }
  }, [collection, collectionId, dispatch])

  const { playlist_id: playlistId, is_album: isAlbum } = collection || {}

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onClickDelete = () => setShowDeleteConfirmation(true)
  const onCancelDelete = () => setShowDeleteConfirmation(false)

  const handleSubmit = useCallback(
    (formFields: PlaylistFormValues, initialValues: PlaylistFormValues) => {
      if (playlistId) {
        track({
          eventName: Name.COLLECTION_EDIT,
          properties: {
            id: playlistId
          }
        })
        // We want to pay special attention to access condition changes
        if (formFields.stream_conditions !== initialValues.stream_conditions) {
          track({
            eventName: Name.COLLECTION_EDIT_ACCESS_CHANGED,
            properties: {
              id: playlistId,
              from: initialValues.stream_conditions,
              to: formFields.stream_conditions
            }
          })
        }
        dispatch(editPlaylist(playlistId, formFields as EditPlaylistValues))
      }
      onClose()
    },
    [playlistId, dispatch, onClose]
  )

  const editPlaylistModalTitle = `${messages.edit} ${
    isAlbum ? messages.title.album : messages.title.playlist
  }`

  const handleDelete = useCallback(() => {
    setShowDeleteConfirmation(false)
    onClose()
    if (isCollectionViewed) {
      dispatch(pushRoute(TRENDING_PAGE))
    }
  }, [onClose, isCollectionViewed, dispatch])

  return (
    <>
      <Modal
        bodyClassName={styles.modalBody}
        modalKey='editplaylist'
        isOpen={isOpen}
        onClose={onClose}
        zIndex={zIndex.EDIT_PLAYLIST_MODAL}
      >
        <ModalHeader>
          <ModalTitle icon={<IconPlaylists />} title={editPlaylistModalTitle} />
        </ModalHeader>
        <ModalContent>
          {collection == null ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <PlaylistForm
              metadata={collection}
              isAlbum={isAlbum}
              onDelete={onClickDelete}
              onCancel={onClose}
              onSave={handleSubmit}
            />
          )}
        </ModalContent>
      </Modal>
      {collectionId ? (
        <DeleteCollectionConfirmationModal
          collectionId={collectionId}
          visible={showDeleteConfirmation}
          onCancel={onCancelDelete}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  )
}

export default EditCollectionModal
