import type { RefObject, MutableRefObject } from 'react'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'

import type { ChatMessageWithExtras } from '@audius/common'
import {
  chatCanFetchMoreMessages,
  chatActions,
  accountSelectors,
  chatSelectors,
  encodeUrlName,
  decodeHashId,
  encodeHashId,
  Status,
  isEarliestUnread,
  playerSelectors
} from '@audius/common'
import { Portal } from '@gorhom/portal'
import { useFocusEffect } from '@react-navigation/native'
import { Keyboard, View, Text, Pressable, FlatList } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import {
  Screen,
  ScreenContent,
  KeyboardAvoidingView
} from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { light } from 'app/haptics'
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

const {
  getChatMessages,
  getOtherChatUsers,
  getChat,
  getChatMessageById,
  getChatMessageByIndex,
  getReactionsPopupMessageId
} = chatSelectors

const { fetchMoreMessages, markChatAsRead, setReactionsPopupMessageId } =
  chatActions
const { getUserId } = accountSelectors
const { getHasTrack } = playerSelectors

export const REACTION_CONTAINER_HEIGHT = 70

const messages = {
  title: 'Messages',
  newMessage: 'New Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  keyboardAvoiding: {
    justifyContent: 'space-between'
  },
  // Weird RN bug? flex: 1 did not appear to set flexGrow: 1 as expected,
  // so had to set manually instead.
  listContainer: {
    flexGrow: 1,
    flexShrink: 1
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
  whiteBackground: {
    backgroundColor: palette.white,
    position: 'absolute',
    height: 500,
    flexGrow: 1,
    top: 0,
    left: 0,
    right: 0
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
  },
  loadingSpinnerContainer: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingSpinner: {
    height: spacing(10),
    width: spacing(10)
  }
}))

const pluralize = (message: string, shouldPluralize: boolean) =>
  message + (shouldPluralize ? 's' : '')

const measureView = (
  viewRef: RefObject<View>,
  measurementRef: MutableRefObject<number>
) => {
  viewRef.current?.measureInWindow((x, y, width, height) => {
    measurementRef.current = y
  })
}

export const ChatScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()
  const navigation = useNavigation<AppTabScreenParamList>()

  const { params } = useRoute<'Chat'>()
  const { chatId } = params
  const url = `/chat/${encodeUrlName(chatId ?? '')}`

  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const hasScrolledToUnreadTag = useRef(false)
  const flatListRef = useRef<FlatList<ChatMessageWithExtras>>(null)
  const itemsRef = useRef<Record<string, View | null>>({})
  const composeRef = useRef<View | null>(null)
  const chatContainerRef = useRef<View | null>(null)
  const messageTop = useRef(0)
  const chatContainerTop = useRef(0)
  const chatContainerBottom = useRef(0)

  const hasCurrentlyPlayingTrack = useSelector(getHasTrack)
  const userId = useSelector(getUserId)
  const userIdEncoded = encodeHashId(userId)
  const chat = useSelector((state) => getChat(state, chatId ?? ''))
  const [otherUser] = useSelector((state) => getOtherChatUsers(state, chatId))
  const chatMessages = useSelector((state) =>
    getChatMessages(state, chatId ?? '')
  )
  const unreadCount = chat?.unread_message_count ?? 0
  const isLoading =
    (chat?.messagesStatus ?? Status.LOADING) === Status.LOADING &&
    chatMessages?.length === 0
  const popupMessageId = useSelector(getReactionsPopupMessageId)
  const popupMessage = useSelector((state) =>
    getChatMessageById(state, chatId ?? '', popupMessageId ?? '')
  )

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

  // Find earliest unread message to display unread tag correctly
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
  const earliestUnreadMessage = useSelector((state) =>
    getChatMessageByIndex(state, chatId, earliestUnreadIndex)
  )
  const earliestUnreadMessageId = earliestUnreadMessage?.message_id

  useEffect(() => {
    // Scroll to earliest unread index, but only the first time
    // entering this chat.
    if (
      earliestUnreadIndex &&
      chatMessages &&
      earliestUnreadIndex > 0 &&
      earliestUnreadIndex < chatMessages.length &&
      !hasScrolledToUnreadTag.current
    ) {
      flatListRef.current?.scrollToIndex({
        index: earliestUnreadIndex,
        viewPosition: 0.95,
        animated: false
      })
      hasScrolledToUnreadTag.current = true
    }
  }, [earliestUnreadIndex, chatMessages])

  const handleScrollToIndexFailed = useCallback((e) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: e.index,
        viewPosition: 0.95,
        animated: false
      })
    }, 10)
  }, [])

  const handleScrollToTop = useCallback(() => {
    if (
      chatId &&
      chatCanFetchMoreMessages(
        chat?.messagesStatus,
        chat?.messagesSummary?.prev_count
      )
    ) {
      // Fetch more messages when user reaches the top
      dispatch(fetchMoreMessages({ chatId }))
    }
  }, [chat?.messagesStatus, chat?.messagesSummary, chatId, dispatch])

  // Mark chat as read when user navigates away from screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(markChatAsRead({ chatId }))
      }
    }, [dispatch, chatId])
  )

  const handleTopRightPress = () => {
    Keyboard.dismiss()
    dispatch(
      setVisibility({
        drawer: 'ChatActions',
        visible: true,
        data: { userId: otherUser.user_id }
      })
    )
  }

  const onCloseReactionPopup = useCallback(() => {
    setShouldShowPopup(false)
    dispatch(setReactionsPopupMessageId({ messageId: null }))
  }, [setShouldShowPopup, dispatch])

  const handleMessagePress = useCallback(
    async (id: string) => {
      const messageRef = itemsRef.current[id]
      if (messageRef === null || messageRef === undefined) {
        return
      }
      // Measure position of selected message to create a copy of it on top
      // of the dimmed background inside the portal.
      const messageY = await new Promise<number>((resolve) => {
        messageRef.measureInWindow((x, y, width, height) => {
          resolve(y)
        })
      })
      // Need to subtract spacing(2) to account for padding in message View.
      messageTop.current = messageY - spacing(2)
      dispatch(setReactionsPopupMessageId({ messageId: id }))
      setShouldShowPopup(true)
      light()
    },
    [dispatch]
  )

  const topBarRight = (
    <IconKebabHorizontal
      onPress={handleTopRightPress}
      fill={palette.neutralLight4}
    />
  )

  // When reaction popup opens, hide reaction here so it doesn't
  // appear underneath the reaction of the message clone inside the
  // portal.
  const renderItem = useCallback(
    ({ item }) => (
      <>
        <ChatMessageListItem
          message={item}
          chatId={chatId}
          itemsRef={itemsRef}
          isPopup={false}
          onLongPress={handleMessagePress}
        />
        {item.message_id === earliestUnreadMessageId ? (
          <View style={styles.unreadTagContainer}>
            <View style={styles.unreadSeparator} />
            <Text style={styles.unreadTag}>
              {unreadCount} {pluralize(messages.newMessage, unreadCount > 1)}
            </Text>
            <View style={styles.unreadSeparator} />
          </View>
        ) : null}
      </>
    ),
    [
      earliestUnreadMessageId,
      handleMessagePress,
      chatId,
      styles.unreadSeparator,
      styles.unreadTag,
      styles.unreadTagContainer,
      unreadCount
    ]
  )

  const maintainVisibleContentPosition = useMemo(
    () => ({
      minIndexForVisible: 0,
      autoscrollToTopThreshold:
        (chatContainerBottom.current - chatContainerTop.current) / 4
    }),
    []
  )

  const measureChatContainerBottom = useCallback(() => {
    measureView(composeRef, chatContainerBottom)
  }, [])

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
          {shouldShowPopup && popupMessage ? (
            <ReactionPopup
              chatId={chatId}
              messageTop={messageTop.current}
              containerTop={chatContainerTop.current}
              containerBottom={chatContainerBottom.current}
              isAuthor={decodeHashId(popupMessage?.sender_user_id) === userId}
              message={popupMessage}
              shouldShowPopup={shouldShowPopup}
              onClose={onCloseReactionPopup}
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
            keyboardShowingOffset={
              hasCurrentlyPlayingTrack ? PLAY_BAR_HEIGHT : 0
            }
            style={[
              styles.keyboardAvoiding,
              hasCurrentlyPlayingTrack ? { bottom: PLAY_BAR_HEIGHT } : null
            ]}
            onKeyboardHide={measureChatContainerBottom}
          >
            {chat?.messagesStatus === Status.SUCCESS &&
            chatMessages?.length === 0 ? (
              <EmptyChatMessages />
            ) : null}
            {isLoading ? (
              <View style={styles.loadingSpinnerContainer}>
                <LoadingSpinner style={styles.loadingSpinner} />
              </View>
            ) : (
              <View style={styles.listContainer}>
                <FlatList
                  contentContainerStyle={styles.listContentContainer}
                  data={chatMessages}
                  keyExtractor={(message) => message.message_id}
                  renderItem={renderItem}
                  onEndReached={handleScrollToTop}
                  inverted
                  initialNumToRender={chatMessages?.length}
                  ref={flatListRef}
                  onScrollToIndexFailed={handleScrollToIndexFailed}
                  refreshing={chat?.messagesStatus === Status.LOADING}
                  maintainVisibleContentPosition={
                    maintainVisibleContentPosition
                  }
                />
              </View>
            )}

            <View
              style={styles.composeView}
              onLayout={measureChatContainerBottom}
              ref={composeRef}
              pointerEvents={'box-none'}
            >
              <View style={styles.whiteBackground} />
              <ChatTextInput chatId={chatId} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </ScreenContent>
    </Screen>
  )
}
