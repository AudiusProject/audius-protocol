import {
  ComponentPropsWithoutRef,
  Fragment,
  useCallback,
  UIEvent,
  useEffect,
  forwardRef,
  useRef,
  useLayoutEffect,
  useState
} from 'react'

import {
  accountSelectors,
  chatActions,
  chatSelectors,
  encodeHashId,
  Status,
  hasTail,
  isEarliestUnread
} from '@audius/common'
import cn from 'classnames'
import { mergeRefs } from 'react-merge-refs'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './ChatMessageList.module.css'
import { ChatMessageListItem } from './ChatMessageListItem'
import { SendMessagePrompt } from './SendMessagePrompt'
import { StickyScrollList } from './StickyScrollList'

const SPINNER_HEIGHT = 48

const { fetchMoreMessages, markChatAsRead, setActiveChat } = chatActions
const { getChatMessages, getChat } = chatSelectors

const messages = {
  newMessages: 'New Messages'
}

type ChatMessageListProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

const SCROLL_TOP_THRESHOLD = 800
const SCROLL_BOTTOM_THRESHOLD = 32

const isScrolledToBottom = (element: HTMLElement) => {
  const { scrollTop, clientHeight, scrollHeight } = element
  return scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD
}

const isScrolledToTop = (element: HTMLElement) => {
  return element.scrollTop < SCROLL_TOP_THRESHOLD
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  (props, forwardedRef) => {
    const { chatId, className: classNameProp, ...other } = props
    const dispatch = useDispatch()
    const chatMessages = useSelector((state) =>
      getChatMessages(state, chatId ?? '')
    )
    const chat = useSelector((state) => getChat(state, chatId ?? ''))
    const userId = useSelector(accountSelectors.getUserId)
    const currentUserId = encodeHashId(userId)
    const [unreadIndicatorEl, setUnreadIndicatorEl] =
      useState<HTMLDivElement | null>(null)
    const [, setLastScrolledChatId] = useState<string>()

    const ref = useRef<HTMLDivElement>(null)

    // A ref so that the unread separator doesn't disappear immediately when the chat is marked as read
    // Using a ref instead of state here to prevent unwanted flickers.
    // The chat/chatId selectors will trigger the rerenders necessary.
    const chatFrozenRef = useRef(chat)
    useLayoutEffect(() => {
      if (chat && chatId !== chatFrozenRef.current?.chat_id) {
        // Update the unread indicator when chatId changes
        chatFrozenRef.current = chat
      }
    }, [chat, chatId])

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
            chat?.messagesStatus !== Status.LOADING
          ) {
            // Fetch more messages when user reaches the top
            dispatch(fetchMoreMessages({ chatId }))
          }
        }
      },
      [dispatch, chatId, chat?.messagesStatus]
    )

    const scrollIntoViewOnMount = useCallback((el: HTMLDivElement) => {
      if (el) {
        el.scrollIntoView()
        // On initial render, can't scroll yet, as the component isn't fully rendered.
        // Instead, queue a scroll by triggering a rerender via a state change.
        setUnreadIndicatorEl(el)
      }
    }, [])

    useLayoutEffect(() => {
      if (unreadIndicatorEl) {
        unreadIndicatorEl.scrollIntoView()
        // One more state change, this keeps chats unread until the user scrolls to the bottom on their own
        setLastScrolledChatId(chatId)
      }
    }, [unreadIndicatorEl, chatId, setLastScrolledChatId])

    useEffect(() => {
      if (
        chatId &&
        (chat?.messagesStatus === Status.IDLE ||
          chat?.messagesStatus === undefined)
      ) {
        // Initial fetch
        dispatch(fetchMoreMessages({ chatId }))
        dispatch(setActiveChat({ chatId }))
      }
    }, [dispatch, chatId, chat?.messagesStatus])

    // Fix for if the initial load doesn't have enough messages to cause scrolling
    useEffect(() => {
      if (
        chatId &&
        ref.current &&
        ref.current.scrollHeight - SPINNER_HEIGHT <= ref.current.clientHeight &&
        chat?.messagesSummary &&
        chat?.messagesSummary.prev_count > 0
      ) {
        dispatch(fetchMoreMessages({ chatId }))
      }
    }, [dispatch, chatId, chat, chatMessages])

    return (
      <StickyScrollList
        ref={mergeRefs([forwardedRef, ref])}
        onScroll={handleScroll}
        className={cn(styles.root, classNameProp)}
        resetKey={chatId}
        updateKey={chatMessages}
        stickToBottom
        {...other}
      >
        <div className={styles.listRoot}>
          {chat?.messagesStatus === Status.SUCCESS &&
          chatMessages?.length === 0 ? (
            <SendMessagePrompt />
          ) : null}
          {chatId &&
            chatMessages?.map((message, i) => (
              <Fragment key={message.message_id}>
                <ChatMessageListItem
                  chatId={chatId}
                  message={message}
                  hasTail={hasTail(message, chatMessages[i - 1])}
                />
                {/* 
                  The separator has to come after the message to appear above it, 
                  since the message list order is reversed in CSS
                */}
                {isEarliestUnread({
                  unreadCount: chatFrozenRef.current?.unread_message_count ?? 0,
                  lastReadAt: chatFrozenRef.current?.last_read_at,
                  currentMessageIndex: i,
                  messages: chatMessages,
                  currentUserId
                }) ? (
                  <div ref={scrollIntoViewOnMount} className={styles.separator}>
                    <span className={styles.tag}>
                      {chatFrozenRef.current?.unread_message_count}{' '}
                      {messages.newMessages}
                    </span>
                  </div>
                ) : null}
              </Fragment>
            ))}
          {!chat?.messagesSummary || chat.messagesSummary.prev_count > 0 ? (
            <LoadingSpinner className={styles.spinner} />
          ) : null}
        </div>
      </StickyScrollList>
    )
  }
)
