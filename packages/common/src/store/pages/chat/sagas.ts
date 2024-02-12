import type {
  ChatMessage,
  TypedCommsResponse,
  UserChat,
  ValidatedChatPermissions
} from '@audius/sdk'
import {
  call,
  delay,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga'
import { ulid } from 'ulid'

import { Name } from '~/models/Analytics'
import { ErrorLevel } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { Status } from '~/models/Status'
import { getAccountUser, getUserId } from '~/store/account/selectors'
import * as toastActions from '~/store/ui/toast/slice'
import dayjs from '~/utils/dayjs'

import { decodeHashId, encodeHashId, removeNullable } from '../../../utils'
import { cacheUsersActions } from '../../cache'
import { getContext } from '../../effects'

import * as chatSelectors from './selectors'
import { actions as chatActions } from './slice'
import { makeChatId } from './utils'

// Attach ulid to window object for debugging DMs
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.ulid = ulid
}

const {
  createChat,
  createChatSucceeded,
  fetchUnreadMessagesCount,
  fetchUnreadMessagesCountSucceeded,
  fetchUnreadMessagesCountFailed,
  goToChat,
  fetchChatIfNecessary,
  fetchLatestChats,
  fetchMoreChats,
  fetchMoreChatsSucceeded,
  fetchMoreChatsFailed,
  fetchLatestMessages,
  fetchMoreMessages,
  fetchMoreMessagesSucceeded,
  fetchMoreMessagesFailed,
  fetchChatSucceeded,
  setMessageReaction,
  setMessageReactionSucceeded,
  setMessageReactionFailed,
  logError,
  markChatAsRead,
  markChatAsReadSucceeded,
  markChatAsReadFailed,
  sendMessage,
  sendMessageFailed,
  addMessage,
  fetchBlockees,
  fetchBlockeesSucceeded,
  fetchBlockers,
  fetchBlockersSucceeded,
  unblockUser,
  blockUser,
  fetchPermissions,
  fetchPermissionsSucceeded,
  fetchLinkUnfurl,
  fetchLinkUnfurlSucceeded,
  deleteChat,
  deleteChatSucceeded
} = chatActions
const {
  getChatsSummary,
  getChat,
  getUnfurlMetadata,
  getNonOptimisticChat,
  getOtherChatUsers
} = chatSelectors
const { toast } = toastActions

const CHAT_PAGE_SIZE = 30
const MESSAGES_PAGE_SIZE = 50

/**
 * Helper to dispatch actions for fetching chat users
 */
function* fetchUsersForChats(chats: UserChat[]) {
  const userIds = new Set<number>([])
  for (const chat of chats) {
    for (const member of chat.chat_members) {
      userIds.add(decodeHashId(member.user_id)!)
    }
  }
  yield* put(
    cacheUsersActions.fetchUsers({
      userIds: Array.from(userIds.values())
    })
  )
}

function* doFetchUnreadMessagesCount() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const response = yield* call([sdk.chats, sdk.chats.getUnreadCount])
    yield* put(
      fetchUnreadMessagesCountSucceeded({ unreadMessagesCount: response.data })
    )
  } catch (e) {
    console.error('fetchUnreadMessagesCountFailed', e)
    yield* put(fetchUnreadMessagesCountFailed())
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

/**
 * Gets all chats fresher than what we currently have
 */
function* doFetchLatestChats() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const summary = yield* select(getChatsSummary)
    let before: string | undefined
    let hasMoreChats = true
    let data: UserChat[] = []
    let firstResponse: TypedCommsResponse<UserChat[]> | undefined
    while (hasMoreChats) {
      const response = yield* call([sdk.chats, sdk.chats.getAll], {
        before,
        after: summary?.next_cursor,
        limit: CHAT_PAGE_SIZE
      })
      hasMoreChats = response.data.length > 0
      before = summary?.prev_cursor
      data = data.concat(response.data)
      if (!firstResponse) {
        firstResponse = response
      }
    }
    yield* fetchUsersForChats(data)
    yield* put(
      fetchMoreChatsSucceeded({
        ...firstResponse,
        data
      })
    )
  } catch (e) {
    console.error('fetchLatestChatsFailed', e)
    yield* put(fetchMoreChatsFailed())
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

function* doFetchMoreChats() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const summary = yield* select(getChatsSummary)
    const before = summary?.prev_cursor
    const response = yield* call([sdk.chats, sdk.chats.getAll], {
      before,
      limit: CHAT_PAGE_SIZE
    })
    yield* fetchUsersForChats(response.data)
    yield* put(fetchMoreChatsSucceeded(response))
  } catch (e) {
    console.error('fetchMoreChatsFailed', e)
    yield* put(fetchMoreChatsFailed())
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

/**
 * Gets all messages newer than what we currently have
 */
function* doFetchLatestMessages(
  action: ReturnType<typeof fetchLatestMessages>
) {
  const { chatId } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)

    // Update the chat too to keep everything in sync
    yield* call(doFetchChat, { chatId })
    const chat = yield* select((state) => getChat(state, chatId))
    const after = chat?.messagesSummary?.next_cursor

    // On first fetch of messages, we won't have an after cursor.
    // Do `fetchMoreMessages` instead for initial fetch of messages and get all up to the first unread
    if (!after) {
      yield* call(doFetchMoreMessages, action)
      return
    }

    let hasMoreUnread = true
    let data: ChatMessage[] = []
    let before: string | undefined
    let firstResponse: TypedCommsResponse<ChatMessage[]> | undefined
    while (hasMoreUnread) {
      // This will get all messages sent after what we currently got, starting at the most recent,
      // and batching by MESSAGE_PAGE_SIZE. Sends one extra request to get the 0 response but oh well
      const response = yield* call([sdk.chats, sdk.chats.getMessages], {
        chatId,
        before,
        after,
        limit: MESSAGES_PAGE_SIZE
      })
      data = data.concat(response.data)
      // If we have no more messages with our after filter, we're done
      hasMoreUnread = response.data.length > 0
      before = response.summary?.prev_cursor
      if (!firstResponse) {
        firstResponse = response
      }
    }
    yield* put(
      fetchMoreMessagesSucceeded({
        chatId,
        response: {
          ...firstResponse,
          data
        }
      })
    )
  } catch (e) {
    console.error('fetchLatestChatMessagesFailed', e)
    yield* put(fetchMoreMessagesFailed({ chatId }))
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId
      }
    })
  }
}

/**
 * Get older messages than what we currently have for a chat
 */
function* doFetchMoreMessages(action: ReturnType<typeof fetchMoreMessages>) {
  const { chatId } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)

    // Ensure we get a chat so we can check the unread count
    yield* call(doFetchChatIfNecessary, { chatId })
    const chat = yield* select((state) => getChat(state, chatId))

    // Paginate through messages until we get to the unread indicator
    let lastResponse: TypedCommsResponse<ChatMessage[]> | undefined
    let before = chat?.messagesSummary?.prev_cursor
    let hasMoreUnread = true
    let data: ChatMessage[] = []
    while (hasMoreUnread) {
      const response = yield* call([sdk.chats, sdk.chats.getMessages], {
        chatId,
        before,
        limit: MESSAGES_PAGE_SIZE
      })
      // Only save the last response summary. Pagination is one-way
      lastResponse = response
      data = data.concat(response.data)
      // If the unread count is greater than the previous fetched messages (next_cursor)
      // plus this batch, we should keep fetching
      hasMoreUnread =
        !!chat?.unread_message_count &&
        chat.unread_message_count >
          (response.summary?.next_count ?? 0) + data.length
      before = response.summary?.prev_cursor
    }
    if (!lastResponse) {
      throw new Error('No responses gathered')
    }
    yield* put(
      fetchMoreMessagesSucceeded({
        chatId,
        response: {
          ...lastResponse,
          data
        }
      })
    )
  } catch (e) {
    console.error('fetchMoreChatMessagesFailed', e)
    yield* put(fetchMoreMessagesFailed({ chatId }))
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId
      }
    })
  }
}

function* doSetMessageReaction(action: ReturnType<typeof setMessageReaction>) {
  const { chatId, messageId, reaction, userId } = action.payload
  const { track, make } = yield* getContext('analytics')
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const user = yield* select(getAccountUser)
    if (!user) {
      throw new Error('User not found')
    }
    yield* call([sdk.chats, sdk.chats.react], {
      chatId,
      messageId,
      reaction
    })
    const reactionResponse = {
      user_id: encodeHashId(userId)!,
      reaction,
      created_at: dayjs().toISOString()
    }
    yield* put(
      setMessageReactionSucceeded({
        chatId,
        messageId,
        reaction: reactionResponse
      })
    )
    yield* call(
      track,
      make({
        eventName: Name.SEND_MESSAGE_REACTION_SUCCESS,
        reaction
      })
    )
  } catch (e) {
    console.error('setMessageReactionFailed', e)
    yield* put(setMessageReactionFailed(action.payload))
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId,
        messageId,
        reaction,
        userId
      }
    })
    yield* call(
      track,
      make({
        eventName: Name.SEND_MESSAGE_REACTION_FAILURE,
        reaction
      })
    )
  }
}

function* doCreateChat(action: ReturnType<typeof createChat>) {
  const { userIds, skipNavigation, presetMessage, replaceNavigation } =
    action.payload
  const { track, make } = yield* getContext('analytics')
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) {
      throw new Error('User not found')
    }
    // Try to get existing chat:
    const chatId = makeChatId([currentUserId, ...userIds])

    // Optimistically go to the chat. If we fail to create it, we'll toast
    if (!skipNavigation) {
      yield* put(goToChat({ chatId, presetMessage, replaceNavigation }))
    }

    try {
      yield* call(doFetchChatIfNecessary, { chatId })
    } catch {}
    const existingChat = yield* select((state) => getChat(state, chatId))
    if (!existingChat) {
      // Create new chat
      yield* call([sdk.chats, sdk.chats.create], {
        userId: encodeHashId(currentUserId),
        invitedUserIds: userIds.map((id) => encodeHashId(id))
      })

      const res = yield* call([sdk.chats, sdk.chats.get], { chatId })
      const chat = res.data
      if (!chat) {
        throw new Error("Chat couldn't be found after creating")
      }
      yield* put(createChatSucceeded({ chat }))
      yield* call(track, make({ eventName: Name.CREATE_CHAT_SUCCESS }))
    }
  } catch (e) {
    console.error('createChatFailed', e)
    yield* put(
      toast({
        type: 'error',
        content: 'Something went wrong. Failed to create chat.'
      })
    )
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        userIds
      }
    })
    yield* call(track, make({ eventName: Name.CREATE_CHAT_FAILURE }))
  }
}

function* doMarkChatAsRead(action: ReturnType<typeof markChatAsRead>) {
  const { chatId } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    // Use non-optimistic chat here so that the calculation of whether to mark
    // the chat as read or not are consistent with values in backend
    const chat = yield* select((state) => getNonOptimisticChat(state, chatId))
    if (
      !chat ||
      !chat?.last_read_at ||
      dayjs(chat?.last_read_at).isBefore(chat?.last_message_at)
    ) {
      yield* call([sdk.chats, sdk.chats.read], { chatId })
      yield* put(markChatAsReadSucceeded({ chatId }))
    } else {
      // Mark the write as 'failed' in this case (just means we already marked this as read somehow)
      // to delete the optimistic read status
      yield* put(markChatAsReadFailed({ chatId }))
    }
  } catch (e) {
    console.error('markChatAsReadFailed', e)
    yield* put(markChatAsReadFailed({ chatId }))
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId
      }
    })
  }
}

function* doSendMessage(action: ReturnType<typeof sendMessage>) {
  const { chatId, message, resendMessageId } = action.payload
  const { track, make } = yield* getContext('analytics')
  const messageIdToUse = resendMessageId ?? ulid()
  const userId = yield* select(getUserId)
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const currentUserId = encodeHashId(userId)
    if (!currentUserId) {
      return
    }

    // Optimistically add the message
    yield* put(
      addMessage({
        chatId,
        message: {
          sender_user_id: currentUserId,
          message_id: messageIdToUse,
          message,
          reactions: [],
          created_at: dayjs().toISOString()
        },
        status: Status.LOADING,
        isSelfMessage: true
      })
    )

    yield* call([sdk.chats, sdk.chats.message], {
      chatId,
      messageId: messageIdToUse,
      message
    })
    yield* call(track, make({ eventName: Name.SEND_MESSAGE_SUCCESS }))
  } catch (e) {
    console.error('sendMessageFailed', e)
    yield* put(sendMessageFailed({ chatId, messageId: messageIdToUse }))

    // Fetch the chat to see if permissions need rechecking
    yield* call(doFetchChat, { chatId })
    // Refetch blocking status to see if user was just blocked or has just blocked that user
    yield* put(fetchBlockees())
    yield* put(fetchBlockers())
    if (userId) {
      const otherUsers = yield* select((state) =>
        getOtherChatUsers(state, chatId)
      )
      // Get permissions of ourselves and other users in the chat
      yield* put(
        fetchPermissions({
          userIds: [userId, ...otherUsers.map((u) => u.user_id)]
        })
      )
    }
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId,
        messageId: messageIdToUse
      }
    })
    yield* call(track, make({ eventName: Name.SEND_MESSAGE_FAILURE }))
  }
}

function* doFetchChat({ chatId }: { chatId: string }) {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  const { data: chat } = yield* call([sdk.chats, sdk.chats.get], { chatId })
  if (chat) {
    yield* fetchUsersForChats([chat])
    yield* put(fetchChatSucceeded({ chat }))
  }
}

function* doFetchChatIfNecessary(args: { chatId: string }) {
  const { chatId } = args
  const existingChat = yield* select((state) => getChat(state, chatId))
  if (!existingChat) {
    yield* call(doFetchChat, { chatId })
  }
}

function* doFetchBlockees() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const { data } = yield* call([sdk.chats, sdk.chats.getBlockees])
    yield* put(
      fetchBlockeesSucceeded({
        blockees: data
          .map((encodedId) => decodeHashId(encodedId))
          .filter(removeNullable)
      })
    )
  } catch (e) {
    console.error('fetchBlockeesFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

function* doFetchBlockers() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const { data } = yield* call([sdk.chats, sdk.chats.getBlockers])
    yield* put(
      fetchBlockersSucceeded({
        blockers: data
          .map((encodedId) => decodeHashId(encodedId))
          .filter(removeNullable)
      })
    )
  } catch (e) {
    console.error('fetchBlockersFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

function* doBlockUser(action: ReturnType<typeof blockUser>) {
  const { userId } = action.payload
  const { track, make } = yield* getContext('analytics')
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    yield* call([sdk.chats, sdk.chats.block], {
      userId: encodeHashId(userId)
    })
    yield* put(fetchBlockees())
    yield* call(
      track,
      make({ eventName: Name.BLOCK_USER_SUCCESS, blockedUserId: userId })
    )
  } catch (e) {
    console.error('blockUserFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
    yield* call(
      track,
      make({ eventName: Name.BLOCK_USER_FAILURE, blockedUserId: userId })
    )
  }
}

function* doUnblockUser(action: ReturnType<typeof unblockUser>) {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    yield* call([sdk.chats, sdk.chats.unblock], {
      userId: encodeHashId(action.payload.userId)
    })
    yield* put(fetchBlockees())
  } catch (e) {
    console.error('unblockUserFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

function* doFetchPermissions(action: ReturnType<typeof fetchPermissions>) {
  try {
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) {
      return
    }
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const { data } = yield* call([sdk.chats, sdk.chats.getPermissions], {
      userIds: action.payload.userIds.map((id) => encodeHashId(id))
    })
    yield* put(
      fetchPermissionsSucceeded({
        permissions: data.reduce(
          (acc, p) => ({
            ...acc,
            [decodeHashId(p.user_id)!]: p
          }),
          {} as Record<ID, ValidatedChatPermissions>
        )
      })
    )
  } catch (e) {
    console.error('fetchPermissionsFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

function* doFetchLinkUnfurlMetadata(
  action: ReturnType<typeof fetchLinkUnfurl>
) {
  const { messageId, chatId, href } = action.payload
  try {
    const unfurlMetadata = yield* select((state) =>
      getUnfurlMetadata(state, chatId, messageId)
    )
    if (unfurlMetadata) {
      return
    }
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const data = yield* call([sdk.chats, sdk.chats.unfurl], {
      urls: [href]
    })
    yield* put(
      fetchLinkUnfurlSucceeded({ chatId, messageId, unfurlMetadata: data[0] })
    )
  } catch (e) {
    console.error('fetchUnfurlFailed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId,
        messageId,
        href
      }
    })
  }
}

function* doDeleteChat(action: ReturnType<typeof deleteChat>) {
  const { chatId } = action.payload
  const { track, make } = yield* getContext('analytics')
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    yield* call([sdk.chats, sdk.chats.delete], {
      chatId
    })
    // Go to chat root page
    yield* put(goToChat({}))
    // Wait for render
    yield* delay(1)
    // NOW delete the chat - otherwise we refetch it right away
    yield* put(deleteChatSucceeded({ chatId }))
    yield* call(track, make({ eventName: Name.DELETE_CHAT_SUCCESS }))
  } catch (e) {
    console.error('deleteChat failed', e, { chatId })
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: {
        chatId
      }
    })
    yield* call(track, make({ eventName: Name.DELETE_CHAT_FAILURE }))
  }
}

function* doLogError({ payload: { error } }: ReturnType<typeof logError>) {
  const { track, make } = yield* getContext('analytics')
  const reportToSentry = yield* getContext('reportToSentry')
  const { code, url } = error
  reportToSentry({
    level: ErrorLevel.Error,
    error,
    additionalInfo: {
      code,
      url
    }
  })
  yield* call(track, make({ eventName: Name.CHAT_WEBSOCKET_ERROR, code }))
}

function* watchFetchUnreadMessagesCount() {
  yield takeLatest(fetchUnreadMessagesCount, () => doFetchUnreadMessagesCount())
}

function* watchAddMessage() {
  yield takeEvery(addMessage, ({ payload }) => doFetchChatIfNecessary(payload))
}

function* watchFetchChatIfNecessary() {
  yield takeEvery(fetchChatIfNecessary, ({ payload }) =>
    doFetchChatIfNecessary(payload)
  )
}

function* watchSendMessage() {
  yield takeEvery(sendMessage, doSendMessage)
}

function* watchFetchLatestChats() {
  yield takeLatest(fetchLatestChats, doFetchLatestChats)
}

function* watchFetchMoreChats() {
  yield takeLatest(fetchMoreChats, doFetchMoreChats)
}

function* watchFetchLatestMessages() {
  yield takeEvery(fetchLatestMessages, doFetchLatestMessages)
}

function* watchFetchMoreMessages() {
  yield takeEvery(fetchMoreMessages, doFetchMoreMessages)
}

function* watchSetMessageReaction() {
  yield takeEvery(setMessageReaction, doSetMessageReaction)
}

function* watchCreateChat() {
  yield takeEvery(createChat, doCreateChat)
}

function* watchMarkChatAsRead() {
  yield takeEvery(markChatAsRead, doMarkChatAsRead)
}

function* watchFetchBlockees() {
  yield takeLatest(fetchBlockees, doFetchBlockees)
}

function* watchFetchBlockers() {
  yield takeLatest(fetchBlockers, doFetchBlockers)
}

function* watchBlockUser() {
  yield takeEvery(blockUser, doBlockUser)
}

function* watchUnblockUser() {
  yield takeEvery(unblockUser, doUnblockUser)
}

function* watchFetchPermissions() {
  yield takeEvery(fetchPermissions, doFetchPermissions)
}

function* watchFetchLinkUnfurlMetadata() {
  yield takeEvery(fetchLinkUnfurl, doFetchLinkUnfurlMetadata)
}

function* watchDeleteChat() {
  yield takeEvery(deleteChat, doDeleteChat)
}

function* watchLogError() {
  yield takeEvery(logError, doLogError)
}

export const sagas = () => {
  return [
    watchFetchUnreadMessagesCount,
    watchFetchChatIfNecessary,
    watchFetchLatestChats,
    watchFetchMoreChats,
    watchFetchLatestMessages,
    watchFetchMoreMessages,
    watchSetMessageReaction,
    watchCreateChat,
    watchMarkChatAsRead,
    watchSendMessage,
    watchAddMessage,
    watchFetchBlockees,
    watchFetchBlockers,
    watchBlockUser,
    watchUnblockUser,
    watchFetchPermissions,
    watchFetchLinkUnfurlMetadata,
    watchDeleteChat,
    watchLogError
  ]
}
