import React, { useCallback, useContext } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { RouterContext } from 'containers/animated-switch/RouterContextProvider'
import { ID } from 'models/common/Identifiers'
import { deletePlaylist } from 'store/cache/collections/actions'
import { AppState } from 'store/types'
import { TRENDING_PAGE } from 'utils/route'

import DeletePlaylistConfirmationModal from './components/DeletePlaylistConfirmationModal'
import * as actions from './store/actions'
import { getIsOpen, getPlaylistId } from './store/selectors'

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
