import React from 'react'

import ActionSheetModal from 'components/action-sheet-modal/ActionSheetModal'
import { ID } from 'models/common/Identifiers'

type DeletePlaylistConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: (playlistId: ID) => void
  playlistId: ID
}

const messages = {
  delete: 'Delete',
  cancel: 'Cancel'
}

const actions = [
  { text: messages.delete, isDestructive: true },
  { text: messages.cancel }
]

const DeletePlaylistConfirmationModal = ({
  isOpen,
  onClose,
  playlistId,
  onDelete
}: DeletePlaylistConfirmationModalProps) => {
  const actionCallbacks = [
    () => {
      onDelete(playlistId)
      onClose()
    },
    () => {
      onClose()
    }
  ]

  const didSelectRow = (row: number) => {
    actionCallbacks[row]()
  }

  return (
    <ActionSheetModal
      isOpen={isOpen}
      onClose={onClose}
      actions={actions}
      didSelectRow={didSelectRow}
    />
  )
}

export default DeletePlaylistConfirmationModal
