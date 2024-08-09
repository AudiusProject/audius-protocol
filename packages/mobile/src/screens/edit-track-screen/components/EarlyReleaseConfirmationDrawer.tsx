import { useCallback } from 'react'

import { useEarlyReleaseConfirmationModal } from '@audius/common/store'

import { ConfirmationDrawer } from 'app/components/drawers'

const getMessages = (contentType: 'track' | 'album') => ({
  header: 'Confirm Early Release',
  description: `Do you want to release your ${contentType} now? Your followers will be notified.`,
  cancel: 'Cancel',
  confirm: 'Release Now'
})

export const EarlyReleaseConfirmationDrawer = () => {
  const { data, onClose } = useEarlyReleaseConfirmationModal()
  const { contentType, confirmCallback, cancelCallback } = data
  const messages = getMessages(contentType)

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
      modalName='EarlyReleaseConfirmation'
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      messages={messages}
    />
  )
}
