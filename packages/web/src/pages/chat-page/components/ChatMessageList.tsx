import {
  ComponentPropsWithoutRef,
  Fragment,
  useCallback,
  UIEvent,
  useEffect,
  forwardRef,
  useRef,
  useLayoutEffect,
  useState,
  useMemo
} from 'react'

import {
  accountSelectors,
  chatActions,
  chatSelectors,
  encodeHashId,
  hasTail,
  isEarliestUnread,
  chatCanFetchMoreMessages
} from '@audius/common'
import { useCanSendMessage } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import { throttle } from 'lodash'
import { mergeRefs } from 'react-merge-refs'
import { useDispatch } from 'react-redux'
import useMeasure from 'react-use-measure'

import { useSelector } from 'common/hooks/useSelector'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './ChatMessageList.module.css'
import { ChatMessageListItem } from './ChatMessageListItem'
import { InboxUnavailableMessage } from './InboxUnavailableMessage'
import { SendMessagePrompt } from './SendMessagePrompt'
import { StickyScrollList } from './StickyScrollList'

const SPINNER_HEIGHT = 48

const { fetchMoreMessages, markChatAsRead, setActiveChat } = chatActions
const { getChatMessages, getChat } = chatSelectors

const messages = {
  newMessages: (count: number) => `${count} New Message${count > 1 ? 's' : ''}`,
  endOfMessages: 'Beginning of Conversation'
}

type ChatMessageListProps = ComponentPropsWithoutRef<'div'> & {
  chatId?: string
}

const SCROLL_TOP_THRESHOLD = 800
const SCROLL_BOTTOM_THRESHOLD = 80
const THROTTLE_DURATION_MS = 500

const isScrolledNearBottom = (element: HTMLElement) => {
  const { scrollTop, clientHeight, scrollHeight } = element
  return scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD
}

const isScrolledNearTop = (element: HTMLElement) => {
  return element.scrollTop < SCROLL_TOP_THRESHOLD
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  (props, forwardedRef) => {
    const { chatId, className: classNameProp, ...other } = props
    const dispatch = useDispatch()
    const chatMessages = useSelector((state) =>
      getChatMessages(state, chatId ?? '')
    )
    const { firstOtherUser, canSendMessage, callToAction } =
      useCanSendMessage(chatId)
    const chat = useSelector((state) => getChat(state, chatId ?? ''))
    const userId = useSelector(accountSelectors.getUserId)
    const currentUserId = userId ? encodeHashId(userId) : null
    const [unreadIndicatorEl, setUnreadIndicatorEl] =
      useState<HTMLDivElement | null>(null)
    const [, setLastScrolledChatId] = useState<string>()

    const ref = useRef<HTMLDivElement>(null)

    const [messageListRef, { height: messageListHeight }] = useMeasure({
      polyfill: ResizeObserver
    })

    const isScrollable = messageListHeight > (ref.current?.clientHeight ?? 0)

    // On first load, mark chat as read
    useEffect(() => {
      if (chatId) {
        dispatch(markChatAsRead({ chatId }))
      }
    }, [chatId, dispatch])

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

    const scrollHandler = useCallback(
      (e: UIEvent<HTMLDivElement>) => {
        if (!chatId) return

        // Handle case where scrolled to bottom
        if (isScrolledNearBottom(e.target as HTMLDivElement)) {
          // Mark chat as read when the user reaches the bottom (saga handles no-op if already read)
          dispatch(markChatAsRead({ chatId }))
          dispatch(setActiveChat({ chatId }))
        } else {
          dispatch(setActiveChat({ chatId: null }))

          if (chat?.messagesSummary?.prev_count === undefined) {
            return
          }

          if (
            chatCanFetchMoreMessages(
              chat?.messagesStatus,
              chat?.messagesSummary?.prev_count
            ) &&
            isScrolledNearTop(e.target as HTMLDivElement)
          ) {
            // Fetch more messages when user reaches the top
            dispatch(fetchMoreMessages({ chatId }))
          }
        }
      },
      [dispatch, chatId, chat?.messagesStatus, chat?.messagesSummary]
    )

    // Memoize the creation of throttled scroll handler, to avoid
    // creating a new throttled function each time and because useCallback
    // doesn't like receiving a non-inlined fn
    // https://dmitripavlutin.com/react-throttle-debounce/
    const throttledScrollHandler = useMemo(
      () =>
        throttle(scrollHandler, THROTTLE_DURATION_MS, {
          leading: true,
          trailing: true
        }),
      [scrollHandler]
    )

    // Cancel any throttled scrolls when component dismounts
    useEffect(() => () => {
      throttledScrollHandler.cancel()
    })

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

    const unreadMessageCount = chatFrozenRef.current?.unread_message_count ?? 0
    return (
      <StickyScrollList
        ref={mergeRefs([forwardedRef, ref])}
        onScroll={throttledScrollHandler}
        className={cn(styles.root, classNameProp)}
        resetKey={chatId}
        updateKey={chatMessages}
        stickToBottom
        scrollBottomThreshold={SCROLL_BOTTOM_THRESHOLD}
        {...other}
      >
        <div className={styles.listRoot} ref={messageListRef}>
          {!canSendMessage && firstOtherUser ? (
            <InboxUnavailableMessage
              user={firstOtherUser}
              action={callToAction}
            />
          ) : null}
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
                  unreadCount: unreadMessageCount,
                  lastReadAt: chatFrozenRef.current?.last_read_at,
                  currentMessageIndex: i,
                  messages: chatMessages,
                  currentUserId
                }) ? (
                  <div ref={scrollIntoViewOnMount} className={styles.separator}>
                    <span className={styles.tag}>
                      {messages.newMessages(unreadMessageCount)}
                    </span>
                  </div>
                ) : null}
              </Fragment>
            ))}
          {!chat?.messagesSummary || chat.messagesSummary.prev_count > 0 ? (
            <LoadingSpinner className={styles.spinner} />
          ) : isScrollable ? (
            <div className={styles.separator}>
              <span className={styles.tag}>{messages.endOfMessages}</span>
            </div>
          ) : null}
        </div>
      </StickyScrollList>
    )
  }
)
