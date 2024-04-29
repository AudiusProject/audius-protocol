import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { chatActions, chatSelectors } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'

const { createChat } = chatActions
const { getCanCreateChat } = chatSelectors

export const useComposeChat = ({
  user,
  onSuccess,
  onInboxUnavailable,
  presetMessage
}: {
  user?: User | null
  onSuccess?: (user: User) => void
  onInboxUnavailable?: (user: User) => void
  presetMessage?: string
}) => {
  const dispatch = useDispatch()

  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId: user?.user_id })
  )

  const composeChat = useCallback(() => {
    if (!user) {
      return
    }
    if (canCreateChat) {
      onSuccess?.(user)
      dispatch(createChat({ userIds: [user.user_id], presetMessage }))
    } else {
      onInboxUnavailable?.(user)
    }
  }, [
    dispatch,
    user,
    canCreateChat,
    onInboxUnavailable,
    onSuccess,
    presetMessage
  ])

  return composeChat
}
