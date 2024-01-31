import { useSelector } from 'react-redux'

import { useProxySelector } from '~/hooks/useProxySelector'
import { User } from '~/models/User'
import { ChatPermissionAction, CommonState } from '~/store/index'
import {
  getCanSendMessage,
  getOtherChatUsers
} from '~/store/pages/chat/selectors'

/**
 * Returns whether or not the current user can send messages to the current chat
 */
export const useCanSendMessage = (
  currentChatId?: string
): {
  canSendMessage: boolean
  callToAction: ChatPermissionAction
  // Explicitly define type as undefinable since users could be empty
  firstOtherUser: User | undefined
} => {
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
