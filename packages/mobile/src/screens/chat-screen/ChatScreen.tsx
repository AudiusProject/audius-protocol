import {
  accountSelectors,
  chatActions,
  chatSelectors,
  playerSelectors
} from '@audius/common/store'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useCanSendMessage } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { ChatMessageWithExtras } from '@audius/common/models'
import {
  encodeUrlName,
  decodeHashId,
  encodeHashId,
  isEarliestUnread,
  chatCanFetchMoreMessages
} from '@audius/common/utils'
import { Portal } from '@gorhom/portal'
import { useKeyboard } from '@react-native-community/hooks'
import { useFocusEffect } from '@react-navigation/native'
import type { FlatListProps, LayoutChangeEvent } from 'react-native'
import {
  AppState,
  FlatList,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import { BOTTOM_BAR_HEIGHT } from 'app/components/bottom-tab-bar'
import {
  KeyboardAvoidingView,
  Screen,
  ScreenContent
} from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { light } from 'app/haptics'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { useToast } from 'app/hooks/useToast'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemePalette } from 'app/utils/theme'

import type { AppTabScreenParamList } from '../app-screen'

import { ChatMessageListItem } from './ChatMessageListItem'
import { ChatMessageSeparator } from './ChatMessageSeparator'
import { ChatTextInput } from './ChatTextInput'
import { ChatUnavailable } from './ChatUnavailable'
import { EmptyChatMessages } from './EmptyChatMessages'
import { HeaderShadow } from './HeaderShadow'
import { ReactionPopup } from './ReactionPopup'
import {
  END_REACHED_MIN_MESSAGES,
  NEW_MESSAGE_TOAST_SCROLL_THRESHOLD,
  SCROLL_TO_BOTTOM_THRESHOLD
} from './constants'

type ChatFlatListProps = FlatListProps<ChatMessageWithExtras>
type ChatListEventHandler<K extends keyof ChatFlatListProps> = NonNullable<
  ChatFlatListProps[K]
>

const {
  getChatMessages,
  getChat,
  getChatMessageById,
  getChatMessageByIndex,
  getReactionsPopupMessageId
} = chatSelectors
const {
  fetchLatestMessages,
  fetchMoreMessages,
  markChatAsRead,
  setReactionsPopupMessageId,
  fetchBlockers,
  fetchBlockees,
  fetchPermissions
} = chatActions
const { getUserId } = accountSelectors
const { getHasTrack } = playerSelectors

const messages = {
  title: 'Messages',
  beginningReached: 'Beginning of Conversation',
  newMessage: (numMessages: number) =>
    `${numMessages} New Message${numMessages > 1 ? 's' : ''}`,
  newMessageReceived: 'New Message!'
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
    display: 'flex',
    flexGrow: 1,
    paddingHorizontal: spacing(6)
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
    fontFamily: typography.fontByWeight.bold,
    color: palette.neutral
  },
  profilePicture: {
    width: spacing(6),
    height: spacing(6),
    marginRight: spacing(2)
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
  },
  emptyContainer: {
    display: 'flex',
    flexGrow: 1
  }
}))

type ContainerLayoutStatus = {
  top: number
  bottom: number
}

type ReactionContainerStyle = {
  paddingTop: number
  bottom: number
}

const getAutoscrollThreshold = ({ top, bottom }: ContainerLayoutStatus) => {
  return (bottom - top) / 4
}

// On iOS, the user will be auto-scrolled on new messages if they are within a certain
// distance of the beginning. We don't need a toast in those scenarios.
// In all others, use a fixed threshold
const getNewMessageToastThreshold = (
  containerLayout: ContainerLayoutStatus
) => {
  return Platform.OS === 'ios'
    ? getAutoscrollThreshold(containerLayout)
    : NEW_MESSAGE_TOAST_SCROLL_THRESHOLD
}

// Gets latest messages on both initial render and when app state changes
const useGetLatestMessages = (
  chatId: string,
  dispatch: ReturnType<typeof useDispatch>
) => {
  const fetchLatestMessagesCallback = useCallback(() => {
    if (chatId) {
      dispatch(fetchLatestMessages({ chatId }))
    }
  }, [dispatch, chatId])

  // Refresh messages on first render
  useEffect(() => {
    console.debug('Fetching latest messages on first render')
    fetchLatestMessagesCallback()
  }, [fetchLatestMessagesCallback])

  // Also listen to app state changes to refresh messages,
  // in case this page was previously in the background
  useEffect(() => {
    const handle = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.debug(
          'App came back from background onto chat page, fetching latest messages'
        )
        fetchLatestMessagesCallback()
      }
    })

    // Remove listener on unmount
    return () => handle.remove()
  })
}

export const ChatScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const navigation = useNavigation<AppTabScreenParamList>()

  const { params } = useRoute<'Chat'>()
  const { chatId, presetMessage } = params
  const url = `/chat/${encodeUrlName(chatId ?? '')}`

  const hasScrolledToUnreadTag = useRef(false)
  const flatListRef = useRef<FlatList<ChatMessageWithExtras>>(null)
  const itemsRef = useRef<Record<string, View | null>>({})
  const composeRef = useRef<View | null>(null)
  const chatContainerRef = useRef<View | null>(null)
  const messageTop = useRef(0)
  const messageHeight = useRef(0)
  const chatContainerTop = useRef(0)
  const chatContainerBottom = useRef(0)
  const scrollPosition = useRef(0)
  const latestMessageId = useRef('')
  const flatListInnerHeight = useRef(0)
  const { keyboardShown } = useKeyboard()
  const insets = useSafeAreaInsets()

  const hasCurrentlyPlayingTrack = useSelector(getHasTrack)
  const userId = useSelector(getUserId)
  const userIdEncoded = encodeHashId(userId)
  const chat = useSelector((state) => getChat(state, chatId ?? ''))
  const chatMessages = useSelector((state) =>
    getChatMessages(state, chatId ?? '')
  )
  const isLoading =
    (chat?.messagesStatus ?? Status.LOADING) === Status.LOADING &&
    chatMessages?.length === 0
  // Only show the end reached indicator if there are no previous messages, more than 10 messages,
  // and the flatlist is scrollable.
  const shouldShowEndReachedIndicator =
    !(chat?.messagesSummary?.prev_count ?? true) &&
    chatMessages.length > END_REACHED_MIN_MESSAGES &&
    flatListInnerHeight.current > chatContainerBottom.current
  const popupMessageId = useSelector(getReactionsPopupMessageId)
  const popupMessage = useSelector((state) =>
    getChatMessageById(state, chatId ?? '', popupMessageId ?? '')
  )
  const { canSendMessage, firstOtherUser: otherUser } =
    useCanSendMessage(chatId)

  // A ref so that the unread separator doesn't disappear immediately when the chat is marked as read
  // Using a ref instead of state here to prevent unwanted flickers.
  // The chat/chatId selectors will trigger the rerenders necessary.
  const chatFrozenRef = useRef(chat)

  useGetLatestMessages(chatId, dispatch)

  useEffect(() => {
    // Update chatFrozenRef when entering a new chat screen.
    if (chat && chatId !== chatFrozenRef.current?.chat_id) {
      chatFrozenRef.current = chat
    }
  }, [chatId, chat])

  // Mark chat as read when user enters this screen.
  useEffect(() => {
    if (chatId) {
      dispatch(markChatAsRead({ chatId }))
    }
  }, [chatId, dispatch])

  // Fetch all permissions, blockers/blockees, and recheck_permissions flag
  useEffect(() => {
    dispatch(fetchBlockees())
    dispatch(fetchBlockers())
    if (otherUser?.user_id) {
      dispatch(fetchPermissions({ userIds: [otherUser.user_id] }))
    }
  }, [chatId, dispatch, otherUser?.user_id])

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

  // Scroll to bottom when user navigates to this screen and there are no unread
  // messages, because if there are we want to scroll to the earliest unread message.
  useFocusEffect(
    useCallback(() => {
      if (chat?.unread_message_count === 0) {
        flatListRef.current?.scrollToOffset({ offset: 0 })
      }
    }, [chat?.unread_message_count])
  )

  // Mark chat as read when user leaves this screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (chatId) {
          dispatch(markChatAsRead({ chatId }))
        }
        // Hacky way to get unread indicator to disappear when user navigates away
        // then returns to this screen while staying in the same navigation stack.
        if (chatFrozenRef.current) {
          chatFrozenRef.current.unread_message_count = 0
        }
      }
    }, [chatId, dispatch])
  )

  const latestMessage = chatMessages.length > 0 ? chatMessages[0] : null

  // If most recent message changes and we are scrolled up, fire a toast
  useEffect(() => {
    if (latestMessage && latestMessage.message_id !== latestMessageId.current) {
      latestMessageId.current = latestMessage.message_id
      // Only fire toasts for received messages, which we can only compute if
      // we have a valid userId
      const isReceivedMessage =
        userIdEncoded && latestMessage.sender_user_id !== userIdEncoded
      if (
        isReceivedMessage &&
        scrollPosition.current >
          getNewMessageToastThreshold({
            bottom: chatContainerBottom.current,
            top: chatContainerTop.current
          })
      ) {
        toast({
          content: messages.newMessageReceived,
          type: 'info'
        })
      }
    }
  }, [latestMessage, latestMessageId, scrollPosition, userIdEncoded, toast])

  const handleScrollToIndexFailed = useCallback<
    ChatListEventHandler<'onScrollToIndexFailed'>
  >((e) => {
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

  const handleScroll = useCallback<ChatListEventHandler<'onScroll'>>(
    (event) => {
      scrollPosition.current = event.nativeEvent.contentOffset.y
      if (scrollPosition.current < SCROLL_TO_BOTTOM_THRESHOLD && chatId) {
        dispatch(markChatAsRead({ chatId }))
      }
    },
    [chatId, dispatch]
  )

  const handleTopRightPress = () => {
    Keyboard.dismiss()
    dispatch(
      setVisibility({
        drawer: 'ChatActions',
        visible: true,
        data: { userId: otherUser?.user_id, chatId }
      })
    )
  }

  const onCloseReactionPopup = useCallback(() => {
    dispatch(setReactionsPopupMessageId({ messageId: null }))
  }, [dispatch])

  const handleMessagePress = useCallback(
    async (id: string) => {
      const messageRef = itemsRef.current[id]
      if (messageRef === null || messageRef === undefined) {
        return
      }
      if (!canSendMessage) {
        return
      }

      // Measure position of selected message to create a copy of it on top
      // of the dimmed background inside the portal.
      messageRef.measure((x, y, width, height, pageX, pageY) => {
        // Need to subtract spacing(2) to account for padding in message View.
        messageTop.current = pageY - spacing(2)
        messageHeight.current = height
        dispatch(setReactionsPopupMessageId({ messageId: id }))
        light()
      })
    },
    [canSendMessage, dispatch]
  )

  const topBarRight = (
    <TouchableOpacity onPress={handleTopRightPress} hitSlop={spacing(2)}>
      <IconKebabHorizontal fill={palette.neutralLight4} />
    </TouchableOpacity>
  )

  // When reaction popup opens, hide reaction here so it doesn't
  // appear underneath the reaction of the message clone inside the
  // portal.
  const renderItem = useCallback(
    ({ item }) => (
      <>
        <ChatMessageListItem
          messageId={item.message_id}
          chatId={chatId}
          itemsRef={itemsRef}
          isPopup={false}
          onLongPress={handleMessagePress}
        />
        {item.message_id === earliestUnreadMessageId &&
        chatFrozenRef.current?.unread_message_count ? (
          <ChatMessageSeparator
            content={messages.newMessage(
              chatFrozenRef.current?.unread_message_count
            )}
          />
        ) : null}
      </>
    ),
    [earliestUnreadMessageId, handleMessagePress, chatId]
  )

  const maintainVisibleContentPosition = useMemo(
    () => ({
      minIndexForVisible: 0,
      autoscrollToTopThreshold: getAutoscrollThreshold({
        top: chatContainerTop.current,
        bottom: chatContainerBottom.current
      })
    }),
    []
  )

  const measureChatContainerBottom = useCallback(() => {
    composeRef.current?.measure((x, y, width, height, pageX, pageY) => {
      chatContainerBottom.current = pageY
    })
  }, [])

  const measureChatContainerTop = useCallback(() => {
    chatContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      chatContainerTop.current = pageY
    })
  }, [])

  const handleOnContentSizeChanged = useCallback(
    (contentWidth, contentHeight) => {
      flatListInnerHeight.current = contentHeight
    },
    []
  )

  const handleFlatListLayout = useCallback((event: LayoutChangeEvent) => {
    flatListInnerHeight.current = event.nativeEvent.layout.height
  }, [])

  // Scroll to the bottom if the user sends a message
  const handleMessageSent = useCallback(() => {
    // Set a timeout to ensure the full render happened and we got the final height
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }, 0)
  }, [flatListRef])

  // For some reason the bottom padding behavior is different between the platforms.
  const getKeyboardAvoidingPlaybarAwareStyle = useCallback(() => {
    const style = {} as ReactionContainerStyle
    if (Platform.OS === 'ios') {
      style.bottom = hasCurrentlyPlayingTrack ? PLAY_BAR_HEIGHT : 0
      style.paddingTop = hasCurrentlyPlayingTrack ? PLAY_BAR_HEIGHT : 0
    } else if (Platform.OS === 'android') {
      style.bottom =
        hasCurrentlyPlayingTrack && !keyboardShown ? PLAY_BAR_HEIGHT : 0
      style.paddingTop =
        hasCurrentlyPlayingTrack && !keyboardShown ? PLAY_BAR_HEIGHT : 0
    }
    return style
  }, [hasCurrentlyPlayingTrack, keyboardShown])

  return (
    <Screen
      url={url}
      headerTitle={
        otherUser
          ? () => (
              <TouchableOpacity
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
              </TouchableOpacity>
            )
          : () => <Text style={styles.userBadgeTitle}>{messages.title}</Text>
      }
      icon={otherUser ? undefined : IconMessage}
      topbarRight={topBarRight}
    >
      <ScreenContent>
        <HeaderShadow />
        {/* Everything inside the portal displays on top of all other screen contents. */}
        <Portal hostName='ChatReactionsPortal'>
          {canSendMessage && popupMessage ? (
            <ReactionPopup
              chatId={chatId}
              messageTop={messageTop.current}
              messageHeight={messageHeight.current}
              containerTop={chatContainerTop.current}
              containerBottom={chatContainerBottom.current}
              isAuthor={decodeHashId(popupMessage?.sender_user_id) === userId}
              message={popupMessage}
              onClose={onCloseReactionPopup}
            />
          ) : null}
        </Portal>
        <View ref={chatContainerRef} onLayout={measureChatContainerTop}>
          <KeyboardAvoidingView
            keyboardShowingOffset={
              hasCurrentlyPlayingTrack
                ? PLAY_BAR_HEIGHT + BOTTOM_BAR_HEIGHT + insets.bottom
                : BOTTOM_BAR_HEIGHT + insets.bottom
            }
            style={[
              styles.keyboardAvoiding,
              getKeyboardAvoidingPlaybarAwareStyle()
            ]}
            onKeyboardHide={measureChatContainerBottom}
            onKeyboardShow={measureChatContainerBottom}
          >
            {isLoading ? (
              <View style={styles.loadingSpinnerContainer}>
                <LoadingSpinner style={styles.loadingSpinner} />
              </View>
            ) : (
              <View style={styles.listContainer}>
                <FlatList
                  onLayout={handleFlatListLayout}
                  contentContainerStyle={styles.listContentContainer}
                  data={chatMessages}
                  keyExtractor={(message) => message.message_id}
                  onContentSizeChange={handleOnContentSizeChanged}
                  renderItem={renderItem}
                  onEndReached={handleScrollToTop}
                  inverted
                  initialNumToRender={chatMessages?.length}
                  ref={flatListRef}
                  onScroll={handleScroll}
                  onScrollToIndexFailed={handleScrollToIndexFailed}
                  refreshing={chat?.messagesStatus === Status.LOADING}
                  keyboardShouldPersistTaps='handled'
                  maintainVisibleContentPosition={
                    maintainVisibleContentPosition
                  }
                  ListEmptyComponent={
                    // Wrap the EmptyChatMessages in a view here rather than within the component
                    // For some reason, this prevents this inversion bug:
                    // https://github.com/facebook/react-native/issues/21196
                    // This is better than doing a rotation transform because when the react bug is fixed,
                    // our workaround won't re-introduce the bug!
                    <View style={styles.emptyContainer}>
                      <EmptyChatMessages />
                    </View>
                  }
                  ListHeaderComponent={
                    canSendMessage ? null : <ChatUnavailable chatId={chatId} />
                  }
                  ListFooterComponent={
                    shouldShowEndReachedIndicator ? (
                      <ChatMessageSeparator
                        content={messages.beginningReached}
                      />
                    ) : null
                  }
                  scrollEnabled={popupMessageId == null}
                  removeClippedSubviews
                  windowSize={5}
                />
              </View>
            )}

            {canSendMessage && chat ? (
              <View
                style={styles.composeView}
                onLayout={measureChatContainerBottom}
                ref={composeRef}
                pointerEvents={'box-none'}
              >
                <View style={styles.whiteBackground} />
                <ChatTextInput
                  chatId={chatId}
                  presetMessage={presetMessage}
                  onMessageSent={handleMessageSent}
                />
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </View>
      </ScreenContent>
    </Screen>
  )
}
