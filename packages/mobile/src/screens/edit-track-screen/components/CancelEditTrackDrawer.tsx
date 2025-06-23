import React from 'react'

import { ConfirmationDrawer } from 'app/components/drawers'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  header: 'Are You Sure?',
  description: 'If you proceed, you will lose any changes you have made.',
  confirm: 'Close and Discard',
  cancel: 'Nevermind'
}

export const CancelEditTrackDrawer = () => {
  const navigation = useNavigation()

  const handleConfirm = () => {
    navigation.goBack()
  }

  return (
    <ConfirmationDrawer
      drawerName='CancelEditTrack'
      messages={messages}
      onConfirm={handleConfirm}
      addBottomInset
    />
  )
}
