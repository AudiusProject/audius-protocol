import {
  ChatMessage,
  TypedCommsResponse,
  UserChat,
  ValidatedChatPermissions
} from '@audius/sdk'
import dayjs from 'dayjs'
import {
  call,
  delay,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga'
import { ulid } from 'ulid'

import { ID } from 'models/Identifiers'
import { Status } from 'models/Status'
import { getAccountUser, getUserId } from 'store/account/selectors'
import { toastActions } from 'store/index'
import { setVisibility } from 'store/ui/modals/slice'

import { decodeHashId, encodeHashId, removeNullable } from '../../../utils'
import { cacheUsersActions } from '../../cache'
import { getContext } from '../../effects'

import * as chatSelectors from './selectors'
import { actions as chatActions } from './slice'

const {
  createChat,
  createChatSucceeded,
  fetchUnreadMessagesCount,
  fetchUnreadMessagesCountSucceeded,
  fetchUnreadMessagesCountFailed,
  goToChat,
  fetchChatIfNecessary,
  fetchMoreChats,
  fetchMoreChatsSucceeded,
  fetchMoreChatsFailed,
  fetchMoreMessages,
  fetchMoreMessagesSucceeded,
  fetchMoreMessagesFailed,
  fetchChatSucceeded,
  setMessageReaction,
  setMessageReactionSucceeded,
  setMessageReactionFailed,
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
const { getChatsSummary, getChat, getUnfurlMetadata, getNonOptimisticChat } =
  chatSelectors
const { toast } = toastActions

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
      limit: 30
    })
    yield* fetchUsersForChats(response.data)
    yield* put(fetchMoreChatsSucceeded(response))
  } catch (e) {
    console.error('fetchMoreChatsFailed', e)
    yield* put(fetchMoreChatsFailed())
  }
}

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
      const limit = 10
      const response = yield* call([sdk.chats, sdk.chats!.getMessages], {
        chatId,
        before,
        limit
      })
      // Only save the last response summary. Pagination is one-way
      lastResponse = response
      data = data.concat(response.data)
      // If the unread count is greater than the previous fetched messages (next_cursor)
      // plus this batch (limit), we should keep fetching
      hasMoreUnread =
        !!chat?.unread_message_count &&
        chat.unread_message_count > (response.summary?.next_count ?? 0) + limit
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
    console.error('fetchNewChatMessagesFailed', e)
    yield* put(fetchMoreMessagesFailed({ chatId }))
  }
}

function* doSetMessageReaction(action: ReturnType<typeof setMessageReaction>) {
  const { chatId, messageId, reaction, userId } = action.payload
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
  } catch (e) {
    console.error('setMessageReactionFailed', e)
    yield* put(setMessageReactionFailed(action.payload))
  }
}

function* doCreateChat(action: ReturnType<typeof createChat>) {
  const { userIds } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) {
      throw new Error('User not found')
    }
    // Try to get existing chat:
    const chatId = [currentUserId, ...userIds]
      .map((id) => encodeHashId(id))
      .sort()
      .join(':')
    try {
      yield* call(doFetchChatIfNecessary, { chatId })
    } catch {}
    const existingChat = yield* select((state) => getChat(state, chatId))
    if (existingChat) {
      // Simply navigate to the existing chat
      yield* put(setVisibility({ modal: 'CreateChat', visible: false }))
      yield* put(goToChat({ chatId: existingChat.chat_id }))
    } else {
      // Create new chat and navigate to it
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
      yield* put(setVisibility({ modal: 'CreateChat', visible: false }))
      yield* put(goToChat({ chatId: chat.chat_id }))
    }
  } catch (e) {
    console.error('createChatFailed', e)
    yield* put(
      toast({
        type: 'error',
        content: 'Something went wrong. Failed to create chat.'
      })
    )
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
    if (!chat || dayjs(chat?.last_read_at).isBefore(chat?.last_message_at)) {
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
  }
}

function* doSendMessage(action: ReturnType<typeof sendMessage>) {
  const { chatId, message, resendMessageId } = action.payload
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
  } catch (e) {
    console.error('sendMessageFailed', e)
    yield* put(sendMessageFailed({ chatId, messageId: messageIdToUse }))

    // Refetch permissions and blocking on failed message send
    yield* put(fetchBlockees())
    yield* put(fetchBlockers())
    if (userId) {
      yield* put(fetchPermissions({ userIds: [userId] }))
    }
  }
}

function* doFetchChatIfNecessary(args: {
  chatId: string
  bustCache?: boolean
}) {
  const { chatId, bustCache = false } = args
  const existingChat = yield* select((state) => getChat(state, chatId))
  if (!existingChat || bustCache) {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const { data: chat } = yield* call([sdk.chats, sdk.chats.get], { chatId })
    if (chat) {
      yield* fetchUsersForChats([chat])
      yield* put(fetchChatSucceeded({ chat }))
    }
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
  }
}

function* doBlockUser(action: ReturnType<typeof blockUser>) {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    yield* call([sdk.chats, sdk.chats.block], {
      userId: encodeHashId(action.payload.userId)
    })
    yield* put(fetchBlockees())
  } catch (e) {
    console.error('blockUserFailed', e)
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
    console.error('fetchPermissionsFailed', e)
  }
}

function* watchFetchUnreadMessagesCount() {
  yield takeLatest(fetchUnreadMessagesCount, () => doFetchUnreadMessagesCount())
}

function* doDeleteChat(action: ReturnType<typeof deleteChat>) {
  const { chatId } = action.payload
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
  } catch (e) {
    console.error('deleteChat failed', e, { chatId })
  }
}

function* watchAddMessage() {
  yield takeEvery(addMessage, ({ payload }) => fetchChatIfNecessary(payload))
}

function* watchFetchChatIfNecessary() {
  yield takeEvery(fetchChatIfNecessary, ({ payload }) =>
    doFetchChatIfNecessary(payload)
  )
}

function* watchSendMessage() {
  yield takeEvery(sendMessage, doSendMessage)
}

function* watchFetchChats() {
  yield takeLatest(fetchMoreChats, doFetchMoreChats)
}

function* watchFetchChatMessages() {
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

export const sagas = () => {
  return [
    watchFetchUnreadMessagesCount,
    watchFetchChatIfNecessary,
    watchFetchChats,
    watchFetchChatMessages,
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
    watchDeleteChat
  ]
}
