import { useCallback } from 'react'

import { chatSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import type { AppState } from 'app/store'
import { setVisibility } from 'app/store/drawers/slice'

import ActionDrawer from '../action-drawer'

const { getDoesBlockUser } = chatSelectors

const CREATE_CHAT_ACTIONS_MODAL_NAME = 'CreateChatActions'

const messages = {
  visitProfile: 'Visit Profile',
  blockMessages: 'Block Messages',
  unblockMessages: 'Unblock Messages',
  deleteConversation: 'Delete Conversation'
}

export const CreateChatActionsDrawer = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { data } = useDrawer('CreateChatActions')
  const { userId } = data
  const doesBlockUser = useSelector((state: AppState) =>
    getDoesBlockUser(state, userId)
  )

  const handleVisitProfilePress = useCallback(() => {
    navigation.navigate('Profile', { id: userId })
  }, [navigation, userId])

  const handleBlockMessagesPress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: true,
        data: { userId }
      })
    )
  }, [dispatch, userId])

  return (
    <ActionDrawer
      drawerName={CREATE_CHAT_ACTIONS_MODAL_NAME}
      rows={[
        {
          text: messages.visitProfile,
          callback: handleVisitProfilePress
        },
        {
          text: doesBlockUser
            ? messages.unblockMessages
            : messages.blockMessages,
          callback: handleBlockMessagesPress
        }
      ]}
    />
  )
}
