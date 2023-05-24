import { useCallback, useEffect, useState } from 'react'

import {
  ID,
  accountActions,
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common'
import {
  IconPlaylists,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import PlaylistForm from 'components/create-playlist/PlaylistForm'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { DeleteCollectionConfirmationModal } from 'components/nav/desktop/PlaylistLibrary/DeleteCollectionConfirmationModal'
import {
  getCollectionId,
  getIsOpen
} from 'store/application/ui/editPlaylistModal/selectors'
import { close } from 'store/application/ui/editPlaylistModal/slice'
import { AppState } from 'store/types'
import zIndex from 'utils/zIndex'

import styles from './EditPlaylistModal.module.css'
const { editPlaylist } = cacheCollectionsActions
const { getCollectionWithUser } = cacheCollectionsSelectors
const fetchSavedPlaylists = accountActions.fetchSavedPlaylists

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

type OwnProps = {}
type EditPlaylistModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const EditPlaylistModal = ({
  isOpen,
  collectionId,
  collection,
  onClose,
  fetchSavedPlaylists,
  editPlaylist
}: EditPlaylistModalProps) => {
  useEffect(() => {
    if (collection == null && collectionId != null) {
      fetchSavedPlaylists()
    }
  }, [collection, collectionId, fetchSavedPlaylists])

  const { playlist_id: playlistId, is_album: isAlbum } = collection || {}
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onClickDelete = () => setShowDeleteConfirmation(true)
  const onCancelDelete = () => setShowDeleteConfirmation(false)
  const onSaveEdit = (formFields: any) => {
    editPlaylist(playlistId!, formFields)
    onClose()
  }

  const editPlaylistModalTitle = `${messages.edit} ${
    isAlbum ? messages.title.album : messages.title.playlist
  }`

  const [isArtworkPopupOpen, setIsArtworkPopupOpen] = useState(false)

  const onOpenArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(true)
  }, [setIsArtworkPopupOpen])

  const onCloseArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(false)
  }, [setIsArtworkPopupOpen])

  return (
    <>
      <Modal
        bodyClassName={styles.modalBody}
        modalKey='editplaylist'
        dismissOnClickOutside={!isArtworkPopupOpen}
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
              isEditMode
              onCloseArtworkPopup={onCloseArtworkPopup}
              onOpenArtworkPopup={onOpenArtworkPopup}
              metadata={collection}
              isAlbum={isAlbum}
              onDelete={onClickDelete}
              onCancel={onClose}
              onSave={onSaveEdit}
            />
          )}
        </ModalContent>
      </Modal>
      {collectionId ? (
        <DeleteCollectionConfirmationModal
          collectionId={collectionId}
          isOpen={showDeleteConfirmation}
          onClose={onCancelDelete}
        />
      ) : null}
    </>
  )
}

const mapStateToProps = (state: AppState) => {
  const collectionId = getCollectionId(state)
  return {
    isOpen: getIsOpen(state),
    collectionId: getCollectionId(state),
    collection: getCollectionWithUser(state, { id: collectionId || undefined })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onClose: () => dispatch(close()),
  fetchSavedPlaylists: () => dispatch(fetchSavedPlaylists()),
  editPlaylist: (playlistId: ID, formFields: any) =>
    dispatch(editPlaylist(playlistId, formFields))
})

export default connect(mapStateToProps, mapDispatchToProps)(EditPlaylistModal)
