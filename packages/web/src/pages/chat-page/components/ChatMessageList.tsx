import { ComponentPropsWithoutRef, useEffect } from 'react'

import { chatActions, chatSelectors } from '@audius/common'
import { ChatMessage } from '@audius/sdk'
import cn from 'classnames'
import dayjs from 'dayjs'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'

import styles from './ChatMessageList.module.css'
import { ChatMessageListItem } from './ChatMessageListItem'

const { fetchNewChatMessages } = chatActions
const { getChatMessages, getChats } = chatSelectors

const messages = {
  newMessages: 'New Messages'
}

type ChatMessageListProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

const MESSAGE_GROUP_THRESHOLD = 2

const areWithinThreshold = (message: ChatMessage, newMessage?: ChatMessage) => {
  if (!newMessage) return false
  return (
    message.sender_user_id === newMessage.sender_user_id &&
    dayjs(newMessage.created_at).diff(message.created_at, 'minutes') <
      MESSAGE_GROUP_THRESHOLD
  )
}

export const ChatMessageList = (props: ChatMessageListProps) => {
  const { chatId } = props
  const dispatch = useDispatch()
  const chatMessages = useSelector((state) =>
    getChatMessages(state, chatId ?? '')
  )
  const { data: chats } = useSelector(getChats)
  const chat = chatId ? chats.find((chat) => chat.chat_id === chatId) : null

  useEffect(() => {
    if (chatId) {
      dispatch(fetchNewChatMessages({ chatId }))
    }
    const pollInterval = setInterval(() => {
      if (chatId) {
        dispatch(fetchNewChatMessages({ chatId }))
      }
    }, 100000000000000000)
    return () => {
      clearInterval(pollInterval)
    }
  }, [dispatch, chatId])

  return (
    <div className={cn(styles.root, props.className)}>
      {chatId &&
        chatMessages?.map((message, i) => (
          <>
            {chat &&
            message.created_at > chat.last_read_at &&
            (!chatMessages[i + 1] ||
              chatMessages[i + 1].created_at <= chat.last_read_at) ? (
              <div className={styles.separator}>
                <span className={styles.tag}>
                  {chat.unread_message_count} {messages.newMessages}
                </span>
              </div>
            ) : null}
            <ChatMessageListItem
              key={message.message_id}
              chatId={chatId}
              message={message}
              isTail={!areWithinThreshold(message, chatMessages[i - 1])}
            />
          </>
        ))}
    </div>
  )
}
