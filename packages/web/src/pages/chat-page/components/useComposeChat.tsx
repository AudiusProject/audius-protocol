import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { chatActions, chatSelectors } from '@audius/common/store'
import { useDispatch } from 'react-redux'

const { createChat } = chatActions
const { useCanCreateChat } = chatSelectors

export const useComposeChat = ({
  user,
  onOpenChat,
  onInboxUnavailable,
  presetMessage
}: {
  user?: User | null
  onOpenChat?: (user: User) => void
  onInboxUnavailable?: (user: User) => void
  presetMessage?: string
}) => {
  const dispatch = useDispatch()

  const { canCreateChat } = useCanCreateChat(user?.user_id)

  const composeChat = useCallback(() => {
    if (!user) {
      return
    }
    if (canCreateChat) {
      onOpenChat?.(user)
      dispatch(createChat({ userIds: [user.user_id], presetMessage }))
    } else {
      onInboxUnavailable?.(user)
    }
  }, [
    dispatch,
    user,
    canCreateChat,
    onInboxUnavailable,
    onOpenChat,
    presetMessage
  ])

  return composeChat
}
