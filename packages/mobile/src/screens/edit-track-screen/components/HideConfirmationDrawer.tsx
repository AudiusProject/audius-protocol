import { useCallback } from 'react'

import { useHideConfirmationModal } from '@audius/common/store'

import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  header: 'Confirm Update',
  description:
    "You're about to change your content from public to hidden. It will be hidden from the public and your followers will lose access.",
  cancel: 'Cancel',
  confirm: 'Make Hidden'
}

export const HideConfirmationDrawer = () => {
  const { data, onClose } = useHideConfirmationModal()
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
    <ConfirmationDrawer
      variant='affirmative'
      modalName='HideConfirmation'
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      messages={messages}
    />
  )
}
