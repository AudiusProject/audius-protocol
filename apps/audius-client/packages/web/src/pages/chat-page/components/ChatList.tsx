import { ComponentPropsWithoutRef, useCallback, useEffect } from 'react'

import {
  chatSelectors,
  chatActions,
  accountSelectors,
  decodeHashId,
  cacheUsersSelectors
} from '@audius/common'
import type { UserChat } from '@audius/sdk'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'

import styles from './ChatList.module.css'

type ChatListItemProps = {
  chat: UserChat
}

const ChatListItem = (props: ChatListItemProps) => {
  const { chat } = props
  const dispatch = useDispatch()
  const currentUserId = useSelector(accountSelectors.getUserId)
  const member = chat.chat_members.find(
    (u) => decodeHashId(u.user_id) !== currentUserId
  )
  const user = useSelector((state) =>
    cacheUsersSelectors.getUser(state, {
      id: member ? decodeHashId(member.user_id) ?? -1 : -1
    })
  )
  const currentChatId = useSelector(chatSelectors.getCurrentChatId)
  const isCurrentChat = currentChatId === chat.chat_id

  const handleClick = useCallback(() => {
    dispatch(chatActions.setCurrentChat({ chatId: chat.chat_id }))
  }, [dispatch, chat])

  if (!user || !member) {
    return null
  }
  return (
    <div
      className={cn(styles.chat, { [styles.current]: isCurrentChat })}
      onClick={handleClick}
    >
      <ProfilePicture user={user} />
      <span>{user.name}</span>
    </div>
  )
}

export const ChatList = (props: ComponentPropsWithoutRef<'div'>) => {
  const dispatch = useDispatch()
  const chats = useSelector(chatSelectors.getChats)
  console.log({ chats })

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  return (
    <div className={cn(styles.root, props.className)}>
      {chats?.map((chat) => (
        <ChatListItem key={chat.chat_id} chat={chat} />
      ))}
    </div>
  )
}
