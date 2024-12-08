import { useCallback } from 'react'

import { chatActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { IconTrash } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'

import { ConfirmationDrawer } from '../drawers'

const { deleteChat } = chatActions

const DELETE_CHAT_MODAL_NAME = 'DeleteChat'

const messages = {
  header: 'Delete Conversation',
  description:
    "Are you sure you want to delete this conversation? \n\nOther people in the conversation will still be able to see it.  This can't be undone.",
  confirm: 'Delete Conversation',
  cancel: 'Cancel'
}

export const DeleteChatDrawer = () => {
  const dispatch = useDispatch()
  const { data } = useDrawer('DeleteChat')
  const { chatId } = data

  const handleConfirmPress = useCallback(() => {
    if (chatId) {
      dispatch(deleteChat({ chatId }))
    }
  }, [chatId, dispatch])

  return (
    <ConfirmationDrawer
      drawerName={DELETE_CHAT_MODAL_NAME}
      icon={IconTrash}
      onConfirm={handleConfirmPress}
      messages={messages}
    />
  )
}
