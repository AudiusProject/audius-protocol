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
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Dispatch } from 'redux'

import PlaylistForm from 'components/create-playlist/PlaylistForm'
import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import {
  getCollectionId,
  getIsOpen
} from 'store/application/ui/editPlaylistModal/selectors'
import { close } from 'store/application/ui/editPlaylistModal/slice'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname, playlistPage } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './EditPlaylistModal.module.css'
const { deletePlaylist, editPlaylist } = cacheCollectionsActions
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
  RouteComponentProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const EditPlaylistModal = ({
  isOpen,
  collectionId,
  collection,
  location,
  onClose,
  fetchSavedPlaylists,
  editPlaylist,
  deletePlaylist,
  goToRoute
}: EditPlaylistModalProps) => {
  useEffect(() => {
    if (collection == null && collectionId != null) {
      fetchSavedPlaylists()
    }
  }, [collection, collectionId, fetchSavedPlaylists])

  const {
    playlist_id: playlistId,
    is_album: isAlbum,
    playlist_name: title,
    user
  } = collection || {}
  const { handle } = user || {}
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onClickDelete = () => setShowDeleteConfirmation(true)
  const onCancelDelete = () => setShowDeleteConfirmation(false)
  const onDelete = () => {
    setShowDeleteConfirmation(false)
    onClose()
    deletePlaylist(playlistId!)
    if (handle && title) {
      const playlistRoute = playlistPage(handle, title, playlistId!)
      // If on the playlist page, direct user to feed
      if (getPathname(location) === playlistRoute) goToRoute(FEED_PAGE)
    }
  }
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
        <ModalHeader onClose={onClose}>
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
      <DeleteConfirmationModal
        title={`${messages.delete} ${
          isAlbum ? messages.title.album : messages.title.playlist
        }`}
        entity={isAlbum ? messages.type.album : messages.type.playlist}
        visible={showDeleteConfirmation}
        onDelete={onDelete}
        onCancel={onCancelDelete}
      />
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
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  editPlaylist: (playlistId: ID, formFields: any) =>
    dispatch(editPlaylist(playlistId, formFields)),
  deletePlaylist: (playlistId: ID) => dispatch(deletePlaylist(playlistId))
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditPlaylistModal)
)
