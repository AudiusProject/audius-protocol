import React from 'react'

import { ID } from 'common/models/Identifiers'
import ActionSheetModal from 'components/action-drawer/ActionDrawer'

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
