import { UIEvent, useCallback, useLayoutEffect, useRef } from 'react'

import {
  chatActions,
  chatSelectors,
  FeatureFlags,
  Status,
  useProxySelector
} from '@audius/common'
import { ResizeObserver } from '@juggle/resize-observer'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'
import useMeasure from 'react-use-measure'

import { useSelector } from 'common/hooks/useSelector'
import Page from 'components/page/Page'
import { useFlag } from 'hooks/useRemoteConfig'
import { chatPage } from 'utils/route'

import styles from './ChatPage.module.css'
import { ChatComposer } from './components/ChatComposer'
import { ChatHeader } from './components/ChatHeader'
import { ChatList } from './components/ChatList'
import { ChatMessageList } from './components/ChatMessageList'
import { CreateChatPrompt } from './components/CreateChatPrompt'

const { getOtherChatUsers, getChatMessagesStatus } = chatSelectors
const { markChatAsRead } = chatActions

const messages = {
  messages: 'Messages'
}

const isScrolledToBottom = (element: HTMLElement) => {
  const { scrollTop, clientHeight, scrollHeight } = element
  return scrollTop + clientHeight >= scrollHeight
}

export const ChatPage = ({ match }: RouteComponentProps<{ id?: string }>) => {
  const currentChatId = match.params.id
  const dispatch = useDispatch()
  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)
  const users = useProxySelector(
    (state) => getOtherChatUsers(state, currentChatId),
    [currentChatId]
  )
  const messagesStatus = useSelector((state) =>
    currentChatId ? getChatMessagesStatus(state, currentChatId) : Status.IDLE
  )

  // Get the height of the header so we can slide the messages list underneath it for the blur effect
  const [headerRef, headerBounds] = useMeasure({
    polyfill: ResizeObserver,
    offsetSize: true
  })
  const messagesRef = useRef<HTMLDivElement>(null)

  // Mark chat as read when the user reaches the bottom
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (currentChatId && isScrolledToBottom(e.currentTarget)) {
        dispatch(markChatAsRead({ chatId: currentChatId }))
      }
    },
    [dispatch, currentChatId]
  )

  // Navigate to new chats
  // Scroll to bottom if active chat is clicked again
  const handleChatClicked = useCallback(
    (chatId: string) => {
      if (chatId !== currentChatId) {
        dispatch(pushRoute(chatPage(chatId)))
      } else {
        messagesRef.current?.scrollTo({
          top: messagesRef.current?.scrollHeight,
          behavior: 'smooth'
        })
      }
    },
    [messagesRef, currentChatId, dispatch]
  )

  // Cache whether the user was already scrolled to the bottom prior to render
  const wasScrolledToBottomBeforeRender =
    messagesRef.current && isScrolledToBottom(messagesRef.current)
  useLayoutEffect(() => {
    // Ensure we're still stuck to the bottom after messages render
    // This is redundant after first messages render, as using reverse flex wrapping
    // so no manual scrolling is necessary for new messages being added
    if (
      wasScrolledToBottomBeforeRender &&
      currentChatId &&
      messagesStatus === Status.SUCCESS
    ) {
      messagesRef.current?.scrollTo({ top: messagesRef.current?.scrollHeight })
    }
  }, [
    messagesRef,
    currentChatId,
    wasScrolledToBottomBeforeRender,
    messagesStatus
  ])

  if (!isChatEnabled) {
    return null
  }
  return (
    <Page
      title={`${users.length > 0 ? users[0].name + ' •' : ''} ${
        messages.messages
      }`}
      containerClassName={styles.page}
      contentClassName={styles.pageContent}
      showSearch={false}
      header={<ChatHeader ref={headerRef} currentChatId={currentChatId} />}
    >
      <div className={styles.layout}>
        <div className={styles.chatList}>
          <ChatList
            className={styles.chatList}
            currentChatId={currentChatId}
            onChatClicked={handleChatClicked}
          />
        </div>
        <div className={styles.chatArea}>
          {currentChatId ? (
            <>
              <div
                ref={messagesRef}
                onScroll={handleScroll}
                className={styles.messages}
                style={{
                  marginTop: `${-headerBounds.height}px`,
                  paddingTop: `${headerBounds.height}px`
                }}
              >
                <ChatMessageList
                  className={styles.messageList}
                  chatId={currentChatId}
                />
              </div>
              <ChatComposer chatId={currentChatId} />
            </>
          ) : (
            <CreateChatPrompt />
          )}
        </div>
      </div>
    </Page>
  )
}
