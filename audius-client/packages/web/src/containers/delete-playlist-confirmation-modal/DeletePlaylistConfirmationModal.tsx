import React, { useCallback, useContext } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { deletePlaylist } from 'common/store/cache/collections/actions'
import * as actions from 'common/store/ui/delete-playlist-confirmation-modal/actions'
import {
  getIsOpen,
  getPlaylistId
} from 'common/store/ui/delete-playlist-confirmation-modal/selectors'
import { RouterContext } from 'containers/animated-switch/RouterContextProvider'
import { AppState } from 'store/types'
import { TRENDING_PAGE } from 'utils/route'

import DeletePlaylistConfirmationModal from './components/DeletePlaylistConfirmationModal'

type DeletePlaylistConfirmationModalProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

// A modal that asks the user to confirm a playlist delete
const ConnectedDeletePlaylistConfirmationModal = ({
  isOpen,
  playlistId,
  onClose,
  onDelete,
  goToRoute
}: DeletePlaylistConfirmationModalProps) => {
  const { setStackReset } = useContext(RouterContext)
  const handleOnDelete = useCallback(
    (playlistId: ID) => {
      setStackReset(true)
      goToRoute(TRENDING_PAGE)
      onDelete(playlistId)
    },
    [onDelete, goToRoute, setStackReset]
  )

  return (
    <DeletePlaylistConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onDelete={handleOnDelete}
      playlistId={playlistId || -1}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    isOpen: getIsOpen(state),
    playlistId: getPlaylistId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    onDelete: (id: ID) => dispatch(deletePlaylist(id)),
    onClose: () => dispatch(actions.setClosed())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedDeletePlaylistConfirmationModal)
