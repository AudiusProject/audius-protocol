import { useCallback } from 'react'

import type { EditAccessType } from '@audius/common/store'
import { useEditAccessConfirmationModal } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'

import { ConfirmationDrawer } from 'app/components/drawers'

const getMessages = (type: Nullable<EditAccessType>) => ({
  header:
    type === 'audience' || type === 'hidden'
      ? 'Confirm Update'
      : type === 'early_release'
      ? 'Confirm Early Release'
      : 'Confirm Release',
  description:
    type === 'audience'
      ? "You're about to change the audience for your content.  This update may cause others to lose the ability to listen and share."
      : type === 'hidden'
      ? "You're about to make your content hidden.  This update may cause others to lose the ability to listen and share."
      : type === 'early_release'
      ? 'Do you want to release your track now? Your followers will be notified.'
      : 'Are you sure you want to make this track public? Your followers will be notified.',
  cancel: 'Cancel',
  confirm:
    type === 'audience'
      ? 'Update Audience'
      : type === 'release' || type === 'early_release'
      ? 'Release Now'
      : 'Hide Track'
})

export const EditAccessConfirmationDrawer = () => {
  const { data, onClose } = useEditAccessConfirmationModal()
  const { type, confirmCallback, cancelCallback } = data
  const messages = getMessages(type)

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  const handleCancel = useCallback(() => {
    cancelCallback()
    onClose()
  }, [cancelCallback, onClose])

  if (!type) return null

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
