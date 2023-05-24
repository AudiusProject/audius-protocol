import { useSelector } from 'react-redux'

import { CommonState } from 'store/index'
import {
  getCanSendMessage,
  getOtherChatUsers
} from 'store/pages/chat/selectors'

import { useProxySelector } from '..'

/**
 * Returns whether or not the current user can send messages to the current chat
 */
export const useCanSendMessage = (currentChatId?: string) => {
  const users = useProxySelector(
    (state) => getOtherChatUsers(state, currentChatId),
    [currentChatId]
  )
  const firstOtherUser = users[0]

  const { canSendMessage, callToAction } = useSelector((state: CommonState) =>
    getCanSendMessage(state, {
      userId: users[0]?.user_id,
      chatId: currentChatId
    })
  )
  return { canSendMessage, callToAction, firstOtherUser }
}
