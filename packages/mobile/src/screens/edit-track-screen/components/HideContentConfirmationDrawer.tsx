import { useCallback } from 'react'

import { useHideContentConfirmationModal } from '@audius/common/store'

import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  header: 'Confirm Update',
  description:
    "You're about to change your content from public to hidden. It will not be visible from the public and your followers will lose access.",
  cancel: 'Cancel',
  confirm: 'Make Hidden'
}

export const HideContentConfirmationDrawer = () => {
  const { data, onClose } = useHideContentConfirmationModal()
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
      modalName='HideContentConfirmation'
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      messages={messages}
    />
  )
}
