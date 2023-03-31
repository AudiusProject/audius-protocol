import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'

import {
  chatActions,
  accountSelectors,
  chatSelectors,
  encodeUrlName,
  decodeHashId,
  encodeHashId,
  Status,
  hasTail,
  isEarliestUnread
} from '@audius/common'
import type { ChatMessage } from '@audius/sdk'
import { Portal } from '@gorhom/portal'
import { useFocusEffect } from '@react-navigation/native'
import {
  Platform,
  View,
  Text,
  KeyboardAvoidingView,
  Pressable
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import type { FlatListT } from 'app/components/core'
import { Screen, ScreenContent, FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemePalette } from 'app/utils/theme'

import type { AppTabScreenParamList } from '../app-screen'

import { ChatMessageListItem } from './ChatMessageListItem'
import { ChatTextInput } from './ChatTextInput'
import { EmptyChatMessages } from './EmptyChatMessages'
import { ReactionPopup } from './ReactionPopup'

const { getChatMessages, getOtherChatUsers, getChat } = chatSelectors

const { fetchMoreMessages, markChatAsRead } = chatActions
const { getUserId } = accountSelectors

export const REACTION_CONTAINER_HEIGHT = 70

const messages = {
  title: 'Messages',
  newMessage: 'New Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between'
  },
  listContainer: {
    flex: 1
  },
  listContentContainer: {
    paddingHorizontal: spacing(6),
    display: 'flex',
    minHeight: '100%'
  },
  profileTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  composeView: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderColor: palette.neutralLight8
  },
  composeTextContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: palette.neutralLight10,
    paddingLeft: spacing(4),
    borderRadius: spacing(1)
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    paddingTop: 0
  },
  icon: {
    width: spacing(7),
    height: spacing(7),
    fill: palette.primary
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: '800',
    color: palette.neutral
  },
  profilePicture: {
    width: spacing(6),
    height: spacing(6),
    marginRight: spacing(2)
  },
  unreadTagContainer: {
    marginVertical: spacing(6),
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  unreadSeparator: {
    height: 1,
    backgroundColor: palette.neutralLight5,
    flexGrow: 1
  },
  unreadTag: {
    color: palette.white,
    fontSize: typography.fontSize.xxs,
    fontFamily: typography.fontByWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: palette.neutralLight5,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: spacing(0.5)
  }
}))

const pluralize = (message: string, shouldPluralize: boolean) =>
  message + (shouldPluralize ? 's' : '')

export const ChatScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()

  const { params } = useRoute<'Chat'>()
  const { chatId } = params
  const url = `/chat/${encodeUrlName(chatId ?? '')}`
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const messageTop = useRef(0)
  const chatContainerBottom = useRef(0)
  const chatContainerTop = useRef(0)
  const [popupChatIndex, setPopupChatIndex] = useState<number | null>(null)
  const navigation = useNavigation<AppTabScreenParamList>()

  const userId = useSelector(getUserId)
  const userIdEncoded = encodeHashId(userId)
  const chat = useSelector((state) => getChat(state, chatId ?? ''))
  const [otherUser] = useSelector((state) => getOtherChatUsers(state, chatId))
  const chatMessages = useSelector((state) =>
    getChatMessages(state, chatId ?? '')
  )
  const flatListRef = useRef<FlatListT<ChatMessage>>(null)
  const itemsRef = useRef<(View | null)[]>([])
  const composeRef = useRef<View | null>(null)
  const chatContainerRef = useRef<View | null>(null)
  const unreadCount = chat?.unread_message_count ?? 0
  const isLoading =
    chat?.messagesStatus === Status.LOADING && chatMessages?.length === 0

  // A ref so that the unread separator doesn't disappear immediately when the chat is marked as read
  // Using a ref instead of state here to prevent unwanted flickers.
  // The chat/chatId selectors will trigger the rerenders necessary.
  const chatFrozenRef = useRef(chat)

  useEffect(() => {
    if (chatId && (chat?.messagesStatus ?? Status.IDLE) === Status.IDLE) {
      // Initial fetch
      dispatch(fetchMoreMessages({ chatId }))
    }
  }, [dispatch, chatId, chat])

  useEffect(() => {
    // Update chatFrozenRef when entering a new chat screen.
    if (chat && chatId !== chatFrozenRef.current?.chat_id) {
      chatFrozenRef.current = chat
    }
  }, [chatId, chat])

  useEffect(() => {
    // Update refs when switching chats or if more chat messages are fetched.
    if (chatMessages) {
      itemsRef.current = itemsRef.current.slice(0, chatMessages.length)
    }
  }, [chatMessages])

  const earliestUnreadIndex = useMemo(
    () =>
      chatMessages?.findIndex((item, index) =>
        isEarliestUnread({
          unreadCount: chatFrozenRef?.current?.unread_message_count ?? 0,
          lastReadAt: chatFrozenRef?.current?.last_read_at,
          currentMessageIndex: index,
          messages: chatMessages,
          currentUserId: userIdEncoded
        })
      ),
    [chatMessages, userIdEncoded]
  )

  useEffect(() => {
    if (
      earliestUnreadIndex &&
      chatMessages &&
      earliestUnreadIndex > 0 &&
      earliestUnreadIndex < chatMessages.length
    ) {
      flatListRef.current?.scrollToIndex({
        index: earliestUnreadIndex,
        viewPosition: 0.5,
        animated: false
      })
    }
  }, [earliestUnreadIndex, chatMessages])

  const handleScrollToIndexFailed = useCallback(
    (e) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: e.index,
          viewPosition: 0.5,
          animated: false
        })
      }, 10)
    },
    [flatListRef]
  )

  const handleScrollToTop = () => {
    if (
      chatId &&
      chat?.messagesStatus !== Status.LOADING &&
      chat?.messagesSummary &&
      chat?.messagesSummary.prev_count > 0
    ) {
      // Fetch more messages when user reaches the top
      dispatch(fetchMoreMessages({ chatId }))
    }
  }

  // Mark chat as read when user navigates away from screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(markChatAsRead({ chatId }))
      }
    }, [dispatch, chatId])
  )

  const handleTopRightPress = () => {
    dispatch(
      setVisibility({
        drawer: 'ChatActions',
        visible: true,
        data: { userId: otherUser.user_id }
      })
    )
  }

  const closeReactionPopup = useCallback(() => {
    setShouldShowPopup(false)
    setPopupChatIndex(null)
  }, [setShouldShowPopup, setPopupChatIndex])

  const handleMessagePress = async (index: number) => {
    if (index < 0 || index >= chatMessages.length) {
      return
    }
    const popupViewRef = itemsRef.current[index]
    if (popupViewRef === null || popupViewRef === undefined) {
      return
    }
    // Measure position of selected message to create a copy of it on top
    // of the dimmed background inside the portal.
    const messageY = await new Promise<number>((resolve) => {
      popupViewRef.measureInWindow((x, y, width, height) => {
        resolve(y)
      })
    })
    // Need to subtract spacing(2) to account for padding in message View.
    messageTop.current = messageY - spacing(2)
    setPopupChatIndex(index)
    setShouldShowPopup(true)
  }

  const topBarRight = (
    <IconKebabHorizontal
      onPress={handleTopRightPress}
      fill={palette.neutralLight4}
    />
  )

  return (
    <Screen
      url={url}
      headerTitle={
        otherUser
          ? () => (
              <Pressable
                onPress={() =>
                  navigation.push('Profile', { id: otherUser.user_id })
                }
                style={styles.profileTitle}
              >
                <ProfilePicture
                  profile={otherUser}
                  style={styles.profilePicture}
                />
                <UserBadges
                  user={otherUser}
                  nameStyle={styles.userBadgeTitle}
                />
              </Pressable>
            )
          : messages.title
      }
      icon={otherUser ? undefined : IconMessage}
      topbarRight={topBarRight}
    >
      <ScreenContent>
        {/* Everything inside the portal displays on top of all other screen contents. */}
        <Portal hostName='ChatReactionsPortal'>
          {shouldShowPopup && popupChatIndex !== null ? (
            <ReactionPopup
              chatId={chatId}
              messageTop={messageTop.current}
              containerBottom={chatContainerBottom.current}
              hasTail={hasTail(
                chatMessages[popupChatIndex],
                chatMessages[popupChatIndex - 1]
              )}
              isAuthor={
                decodeHashId(chatMessages[popupChatIndex].sender_user_id) ===
                userId
              }
              message={chatMessages[popupChatIndex]}
              closePopup={closeReactionPopup}
            />
          ) : null}
        </Portal>
        <View
          ref={chatContainerRef}
          onLayout={() => {
            chatContainerRef.current?.measureInWindow((x, y, width, height) => {
              chatContainerTop.current = y
            })
          }}
        >
          <KeyboardAvoidingView
            keyboardVerticalOffset={
              Platform.OS === 'ios' ? chatContainerTop.current : 0
            }
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.rootContainer}
          >
            {!isLoading ? (
              chatMessages?.length > 0 ? (
                <View style={styles.listContainer}>
                  <FlatList
                    contentContainerStyle={styles.listContentContainer}
                    data={chatMessages}
                    keyExtractor={(message) => message.message_id}
                    renderItem={({ item, index }) => (
                      <>
                        {/* When reaction popup opens, hide reaction here so it doesn't
                          appear underneath the reaction of the message clone inside the
                          portal. */}
                        <ChatMessageListItem
                          message={item}
                          ref={(el) => (itemsRef.current[index] = el)}
                          shouldShowReaction={index !== popupChatIndex}
                          hasTail={hasTail(item, chatMessages[index - 1])}
                          onLongPress={() => handleMessagePress(index)}
                        />
                        {index === earliestUnreadIndex ? (
                          <View style={styles.unreadTagContainer}>
                            <View style={styles.unreadSeparator} />
                            <Text style={styles.unreadTag}>
                              {unreadCount}{' '}
                              {pluralize(messages.newMessage, unreadCount > 1)}
                            </Text>
                            <View style={styles.unreadSeparator} />
                          </View>
                        ) : null}
                      </>
                    )}
                    onEndReached={handleScrollToTop}
                    inverted
                    initialNumToRender={chatMessages?.length}
                    ref={flatListRef}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    refreshing={chat?.messagesStatus === Status.LOADING}
                  />
                </View>
              ) : (
                <EmptyChatMessages />
              )
            ) : (
              <LoadingSpinner />
            )}

            <View
              style={styles.composeView}
              onLayout={() => {
                composeRef.current?.measureInWindow((x, y, width, height) => {
                  chatContainerBottom.current = y
                })
              }}
              ref={composeRef}
              pointerEvents={'box-none'}
            >
              <ChatTextInput chatId={chatId} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </ScreenContent>
    </Screen>
  )
}
