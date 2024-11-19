import { useCallback } from 'react'

import {
  cacheTracksActions,
  deleteTrackConfirmationModalUISelectors
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { DeleteConfirmationModal } from 'components/delete-confirmation'

const { deleteTrack } = cacheTracksActions
const { getTrackId } = deleteTrackConfirmationModalUISelectors

const messages = {
  delete: 'Delete Track',
  track: 'Track',
  cancel: 'Cancel'
}

export const DeleteTrackConfirmationModal = () => {
  const [isOpen, setIsOpen] = useModalState('DeleteTrackConfirmation')
  const trackId = useSelector(getTrackId) ?? -1
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleDelete = useCallback(() => {
    dispatch(deleteTrack(trackId))
    handleClose()
  }, [dispatch, trackId, handleClose])

  return (
    <DeleteConfirmationModal
      title={messages.delete}
      entity={messages.track}
      visible={isOpen}
      onCancel={handleClose}
      onDelete={handleDelete}
    />
  )
}
