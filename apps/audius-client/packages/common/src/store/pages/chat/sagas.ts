import {
  ChatMessage,
  TypedCommsResponse,
  ValidatedChatPermissions
} from '@audius/sdk'
import dayjs from 'dayjs'
import { call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'
import { ulid } from 'ulid'

import { ID } from 'models/Identifiers'
import { Status } from 'models/Status'
import { getAccountUser, getUserId } from 'store/account/selectors'
import { setVisibility } from 'store/ui/modals/slice'

import { decodeHashId, encodeHashId, removeNullable } from '../../../utils'
import { cacheUsersActions } from '../../cache'
import { getContext } from '../../effects'

import * as chatSelectors from './selectors'
import { actions as chatActions } from './slice'

const {
  createChat,
  createChatSucceeded,
  goToChat,
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
  fetchLinkUnfurlSucceeded
} = chatActions
const { getChatsSummary, getChat, getUnfurlMetadata } = chatSelectors

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
    const userIds = new Set<number>([])
    for (const chat of response.data) {
      for (const member of chat.chat_members) {
        userIds.add(decodeHashId(member.user_id)!)
      }
    }
    yield* put(
      cacheUsersActions.fetchUsers({
        userIds: Array.from(userIds.values())
      })
    )
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
    yield* call(fetchChatIfNecessary, { chatId })
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
      yield* call(fetchChatIfNecessary, { chatId })
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
  }
}

function* doMarkChatAsRead(action: ReturnType<typeof markChatAsRead>) {
  const { chatId } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const chat = yield* select((state) => getChat(state, chatId))
    if (!chat || !dayjs(chat?.last_read_at).isAfter(chat?.last_message_at)) {
      yield* call([sdk.chats, sdk.chats.read], { chatId })
      yield* put(markChatAsReadSucceeded({ chatId }))
    }
  } catch (e) {
    console.error('markChatAsReadFailed', e)
    yield* put(markChatAsReadFailed({ chatId }))
  }
}

function* doSendMessage(action: ReturnType<typeof sendMessage>) {
  const { chatId, message } = action.payload
  const messageId = ulid()
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const userId = yield* select(getUserId)
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
          message_id: messageId,
          message,
          reactions: [],
          created_at: dayjs().toISOString()
        },
        status: Status.LOADING
      })
    )

    yield* call([sdk.chats, sdk.chats.message], {
      chatId,
      messageId,
      message
    })
  } catch (e) {
    console.error('sendMessageFailed', e)
    yield* put(sendMessageFailed({ chatId, messageId }))
  }
}

function* fetchChatIfNecessary(args: { chatId: string }) {
  const { chatId } = args
  const existingChat = yield* select((state) => getChat(state, chatId))
  if (!existingChat) {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const { data: chat } = yield* call([sdk.chats, sdk.chats.get], { chatId })
    if (chat) {
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

function* watchAddMessage() {
  yield takeEvery(addMessage, ({ payload }) => fetchChatIfNecessary(payload))
}

function* watchSendMessage() {
  yield takeEvery(sendMessage, doSendMessage)
}

function* watchFetchChats() {
  yield takeLatest(fetchMoreChats, doFetchMoreChats)
}

function* watchFetchChatMessages() {
  yield takeLatest(fetchMoreMessages, doFetchMoreMessages)
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

export const sagas = () => {
  return [
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
    watchFetchLinkUnfurlMetadata
  ]
}
