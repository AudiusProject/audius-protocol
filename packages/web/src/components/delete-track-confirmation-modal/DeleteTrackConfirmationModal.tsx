import { useCallback } from 'react'

import { useDeleteTrack } from '@audius/common/api'
import { useDeleteTrackConfirmationModal } from '@audius/common/store'

import { DeleteConfirmationModal } from 'components/delete-confirmation'

const messages = {
  delete: 'Delete Track',
  track: 'Track'
}

export const DeleteTrackConfirmationModal = () => {
  const { data, isOpen, onClose } = useDeleteTrackConfirmationModal()
  const { trackId, onSuccess, onCancel } = data
  const { mutate: deleteTrack } = useDeleteTrack()

  const handleConfirm = useCallback(() => {
    deleteTrack(
      { trackId, source: 'delete_track_confirmation_modal' },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose()
        }
      }
    )
  }, [trackId, deleteTrack, onSuccess, onClose])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onClose()
  }, [onCancel, onClose])

  return (
    <DeleteConfirmationModal
      title={messages.delete}
      entity={messages.track}
      visible={isOpen}
      onCancel={handleCancel}
      onDelete={handleConfirm}
    />
  )
}
