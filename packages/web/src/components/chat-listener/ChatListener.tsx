import { useEffect } from 'react'

import { GUEST_EMAIL } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { accountSelectors, chatActions } from '@audius/common/store'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useDispatch, useSelector } from 'react-redux'

const { connect, disconnect, fetchMoreChats, fetchUnreadMessagesCount } =
  chatActions
const { getAccountStatus } = accountSelectors

export const ChatListener = () => {
  const dispatch = useDispatch()
  const accountStatus = useSelector(getAccountStatus)
  const isGuest = useLocalStorage(GUEST_EMAIL)
  // Connect to chats websockets and prefetch chats
  useEffect(() => {
    if (accountStatus === Status.SUCCESS && !isGuest) {
      dispatch(connect())
      dispatch(fetchMoreChats())
      dispatch(fetchUnreadMessagesCount())
    }
    return () => {
      dispatch(disconnect())
    }
  }, [dispatch, accountStatus, isGuest])
  return null
}
