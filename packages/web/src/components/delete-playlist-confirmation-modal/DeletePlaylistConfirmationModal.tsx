import { useCallback, useContext, useMemo } from 'react'

import {
  cacheCollectionsActions,
  deletePlaylistConfirmationModalUISelectors
} from '@audius/common/store'

import {} from '@audius/common'
import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import ActionSheetModal from 'components/action-drawer/ActionDrawer'
import { RouterContext } from 'components/animated-switch/RouterContextProvider'
import { TRENDING_PAGE } from 'utils/route'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions

const messages = {
  delete: 'Delete',
  cancel: 'Cancel'
}

const actions = [
  { text: messages.delete, isDestructive: true },
  { text: messages.cancel }
]

const DeletePlaylistConfirmationModal = () => {
  const [isOpen, setIsOpen] = useModalState('DeletePlaylistConfirmation')
  const playlistId = useSelector(getPlaylistId) ?? -1
  const dispatch = useDispatch()
  const { setStackReset } = useContext(RouterContext)

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleDelete = useCallback(() => {
    setStackReset(true)
    dispatch(push(TRENDING_PAGE))
    dispatch(deletePlaylist(playlistId))
    handleClose()
  }, [dispatch, setStackReset, playlistId, handleClose])

  const actionCallbacks = useMemo(
    () => [handleDelete, handleClose],
    [handleDelete, handleClose]
  )

  const didSelectRow = (row: number) => {
    actionCallbacks[row]()
  }

  return (
    <ActionSheetModal
      isOpen={isOpen}
      onClose={handleClose}
      actions={actions}
      didSelectRow={didSelectRow}
    />
  )
}

export default DeletePlaylistConfirmationModal
