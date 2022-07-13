import { useCallback, useContext, useMemo } from 'react'

import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { deletePlaylist } from 'common/store/cache/collections/actions'
import { getPlaylistId } from 'common/store/ui/delete-playlist-confirmation-modal/selectors'
import ActionSheetModal from 'components/action-drawer/ActionDrawer'
import { RouterContext } from 'components/animated-switch/RouterContextProvider'
import { TRENDING_PAGE } from 'utils/route'

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
