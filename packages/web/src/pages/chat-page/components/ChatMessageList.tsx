import {
  ComponentPropsWithoutRef,
  Fragment,
  useCallback,
  UIEvent,
  useEffect,
  forwardRef
} from 'react'

import {
  accountSelectors,
  chatActions,
  chatSelectors,
  encodeHashId,
  Status,
  hasTail
} from '@audius/common'
import type { ChatMessage, UserChat } from '@audius/sdk'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './ChatMessageList.module.css'
import { ChatMessageListItem } from './ChatMessageListItem'
import { StickyScrollList } from './StickyScrollList'

const { fetchMoreMessages, markChatAsRead, setActiveChat } = chatActions
const {
  getChatMessages,
  getChatMessagesStatus,
  getChatMessagesSummary,
  getChat
} = chatSelectors

const messages = {
  newMessages: 'New Messages'
}

type ChatMessageListProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

const SCROLL_TOP_THRESHOLD = 800

const isScrolledToBottom = (element: HTMLElement) => {
  const { scrollTop, clientHeight, scrollHeight } = element
  return scrollTop + clientHeight >= scrollHeight
}

const isScrolledToTop = (element: HTMLElement) => {
  return element.scrollTop < SCROLL_TOP_THRESHOLD
}

/**
 * Checks if the current message is the first unread message in the given chat
 * Used to render the new messages separator indicator
 */
const isFirstUnread = (
  chat: UserChat,
  message: ChatMessage,
  currentUserId: string | null,
  prevMessage?: ChatMessage
) =>
  message.created_at > chat.last_read_at &&
  (!prevMessage || prevMessage.created_at <= chat.last_read_at) &&
  message.sender_user_id !== currentUserId

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  (props, forwardedRef) => {
    const { chatId, className: classNameProp, ...other } = props
    const dispatch = useDispatch()
    const chatMessages = useSelector((state) =>
      getChatMessages(state, chatId ?? '')
    )
    const summary = useSelector((state) =>
      getChatMessagesSummary(state, chatId ?? '')
    )
    const status = useSelector((state) =>
      getChatMessagesStatus(state, chatId ?? '')
    )
    const chat = useSelector((state) => getChat(state, chatId))
    const userId = useSelector(accountSelectors.getUserId)
    const currentUserId = encodeHashId(userId)

    const handleScroll = useCallback(
      (e: UIEvent<HTMLDivElement>) => {
        if (chatId && isScrolledToBottom(e.currentTarget)) {
          // Mark chat as read when the user reaches the bottom (saga handles no-op if already read)
          dispatch(markChatAsRead({ chatId }))
          dispatch(setActiveChat({ chatId }))
        } else {
          dispatch(setActiveChat({ chatId: null }))
          if (
            chatId &&
            isScrolledToTop(e.currentTarget) &&
            status !== Status.LOADING
          ) {
            // Fetch more messages when user reaches the top
            dispatch(fetchMoreMessages({ chatId }))
          }
        }
      },
      [dispatch, chatId, status]
    )

    useEffect(() => {
      if (chatId && status === Status.IDLE) {
        // Initial fetch
        dispatch(fetchMoreMessages({ chatId }))
        dispatch(setActiveChat({ chatId }))
      }
    }, [dispatch, chatId, status])

    return (
      <StickyScrollList
        ref={forwardedRef}
        onScroll={handleScroll}
        className={cn(styles.root, classNameProp)}
        resetKey={chatId}
        updateKey={chatMessages}
        stickToBottom
        {...other}
      >
        <div className={styles.listRoot}>
          {chatId &&
            chatMessages?.map((message, i) => (
              <Fragment key={message.message_id}>
                <ChatMessageListItem
                  chatId={chatId}
                  message={message}
                  hasTail={hasTail(message, chatMessages[i - 1])}
                />
                {/* 
              The separator has to come after the message to appear before it, 
              since the message list order is reversed in CSS
            */}
                {chat &&
                chat.unread_message_count &&
                isFirstUnread(
                  chat,
                  message,
                  currentUserId,
                  chatMessages[i + 1]
                ) ? (
                  <div className={styles.separator}>
                    <span className={styles.tag}>
                      {chat.unread_message_count} {messages.newMessages}
                    </span>
                  </div>
                ) : null}
              </Fragment>
            ))}
          {summary?.prev_count ? (
            <LoadingSpinner className={styles.spinner} />
          ) : null}
        </div>
      </StickyScrollList>
    )
  }
)
