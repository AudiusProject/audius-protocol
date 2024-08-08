import { useCallback } from 'react'

import { useEditAccessConfirmationModal } from '@audius/common/store'

import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  header: 'Confirm Update',
  description:
    "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share.",
  cancel: 'Cancel',
  confirm: 'Update Audience'
}

export const EditAccessConfirmationDrawer = () => {
  const { data, onClose } = useEditAccessConfirmationModal()
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
      modalName='EditAccessConfirmation'
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      messages={messages}
    />
  )
}
