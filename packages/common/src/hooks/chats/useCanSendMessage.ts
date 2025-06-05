import { useSelector } from 'react-redux'

import { useCurrentUserId, useOtherChatUsers } from '~/api'
import { User } from '~/models/User'
import { ChatPermissionAction, CommonState } from '~/store/index'
import { getCanSendMessage } from '~/store/pages/chat/selectors'

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
  const { data: currentUserId } = useCurrentUserId()
  const users = useOtherChatUsers(currentChatId)

  const firstOtherUser = users[0]

  const { canSendMessage, callToAction } = useSelector((state: CommonState) =>
    getCanSendMessage(state, {
      userId: users[0]?.user_id,
      chatId: currentChatId,
      currentUserId
    })
  )
  return { canSendMessage, callToAction, firstOtherUser }
}
