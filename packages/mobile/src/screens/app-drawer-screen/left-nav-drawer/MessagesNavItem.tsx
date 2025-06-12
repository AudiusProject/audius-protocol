import React, { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { chatSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { IconMessages, NotificationCount } from '@audius/harmony-native'
import { make } from 'app/services/analytics'

import { LeftNavLink } from './LeftNavLink'

const { getHasUnreadMessages, getUnreadMessagesCount } = chatSelectors

export const MessagesNavItem = () => {
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)

  const handleMessagesPress = useCallback(() => {
    make({ eventName: Name.CHAT_ENTRY_POINT, source: 'navmenu' })
  }, [])

  return (
    <LeftNavLink
      icon={IconMessages}
      label='Messages'
      to='ChatList'
      showNotificationBubble={hasUnreadMessages}
      onPress={handleMessagesPress}
    >
      {unreadMessagesCount > 0 ? (
        <NotificationCount count={unreadMessagesCount} />
      ) : undefined}
    </LeftNavLink>
  )
}
