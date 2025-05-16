import { useEffect } from 'react'

import { selectIsGuestAccount, useCurrentAccount } from '@audius/common/api'
import { chatActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

const { connect, disconnect, fetchMoreChats, fetchUnreadMessagesCount } =
  chatActions

export const ChatListener = () => {
  const dispatch = useDispatch()
  const { data: accountData, isSuccess: isAccountSuccess } = useCurrentAccount({
    select: (account) => ({
      isGuest: selectIsGuestAccount(account)
    })
  })
  const { isGuest } = accountData ?? {}
  // Connect to chats websockets and prefetch chats
  useEffect(() => {
    if (isAccountSuccess && !isGuest) {
      dispatch(connect())
      dispatch(fetchMoreChats())
      dispatch(fetchUnreadMessagesCount())
    }
    return () => {
      dispatch(disconnect())
    }
  }, [dispatch, isAccountSuccess, isGuest])
  return null
}
