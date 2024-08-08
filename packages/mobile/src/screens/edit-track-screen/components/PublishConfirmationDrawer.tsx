import { useCallback } from 'react'

import { usePublishConfirmationModal } from '@audius/common/store'

import { ConfirmationDrawer } from 'app/components/drawers'

const getMessages = (contentType: 'track' | 'album' | 'playlist') => ({
  header: 'Confirm Release',
  description: `Are you sure you want to make this ${contentType} public? Your followers will be notified.`,
  cancel: 'Go Back',
  confirm: 'Release Now'
})

export const PublishConfirmationDrawer = () => {
  const { data, onClose } = usePublishConfirmationModal()
  const { contentType, confirmCallback } = data
  const messages = getMessages(contentType)

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='PublishConfirmation'
      onConfirm={handleConfirm}
      onCancel={onClose}
      messages={messages}
    />
  )
}
