import { useCallback } from 'react'

import { useDeleteTrackConfirmationModal } from '@audius/common/store'

import { DeleteConfirmationModal } from 'components/delete-confirmation'

const messages = {
  delete: 'Delete Track',
  track: 'Track'
}

export const DeleteTrackConfirmationModal = () => {
  const { data, isOpen, onClose } = useDeleteTrackConfirmationModal()
  const { confirmCallback, cancelCallback } = data

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  const handleCancel = useCallback(() => {
    cancelCallback?.()
    onClose()
  }, [cancelCallback, onClose])

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
