import { useCallback } from 'react'

import { useReplaceTrackConfirmationModal } from '@audius/common/store'

import { Hint, IconError } from '@audius/harmony-native'
import { ConfirmationDrawer } from 'app/components/drawers'

const messages = {
  header: 'Are You Sure?',
  description: 'Are you sure you want to replace the file for this track?',
  hintText:
    'This change may impact accuracy of comment timestamps. Social metrics such as reposts won’t be affected.',
  confirm: 'Confirm & Upload',
  cancel: 'Cancel'
}

export const ReplaceTrackConfirmationDrawer = () => {
  const { data, onClose } = useReplaceTrackConfirmationModal()
  const { confirmCallback } = data

  const handleConfirm = useCallback(() => {
    confirmCallback()
    onClose()
  }, [confirmCallback, onClose])

  return (
    <ConfirmationDrawer
      variant='affirmative'
      modalName='ReplaceTrackConfirmation'
      onConfirm={handleConfirm}
      onCancel={onClose}
      messages={messages}
    >
      <Hint pv='s' icon={IconError}>
        {messages.hintText}
      </Hint>
    </ConfirmationDrawer>
  )
}
