import { ComponentPropsWithoutRef, useEffect } from 'react'

import {
  accountSelectors,
  chatActions,
  chatSelectors,
  decodeHashId,
  cacheUsersSelectors
} from '@audius/common'
import type { ChatMessage } from '@audius/sdk'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'

import styles from './ChatMessageList.module.css'

const { fetchNewChatMessages } = chatActions
const { getChatMessages } = chatSelectors

type ChatMessageListItemProps = {
  message: ChatMessage
}

const ChatMessageListItem = (props: ChatMessageListItemProps) => {
  const { message } = props
  const senderUserId = decodeHashId(message.sender_user_id)
  const userId = useSelector(accountSelectors.getUserId)
  const isAuthor = userId === senderUserId
  const user = useSelector((state) =>
    cacheUsersSelectors.getUser(state, { id: senderUserId })
  )
  return (
    <div
      className={cn(styles.message, {
        [styles.isAuthor]: isAuthor
      })}
    >
      {user ? <ProfilePicture user={user} /> : null}
      <div className={styles.messageBubble}>
        <div className={styles.messageBubbleText}>{message.message}</div>
      </div>
    </div>
  )
}

type ChatMessageListProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

export const ChatMessageList = (props: ChatMessageListProps) => {
  const { chatId } = props
  const dispatch = useDispatch()
  const messages = useSelector((state) => getChatMessages(state, chatId ?? ''))

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (chatId) {
        dispatch(fetchNewChatMessages({ chatId }))
      }
    }, 1000)
    return () => {
      clearInterval(pollInterval)
    }
  }, [dispatch, chatId])

  return (
    <div className={cn(styles.root, props.className)}>
      {messages?.map((message) => (
        <ChatMessageListItem key={message.message_id} message={message} />
      ))}
    </div>
  )
}
