import { ChatCreateRPC } from '@audius/sdk'
import dayjs from 'dayjs'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { getAccountUser } from 'store/account/selectors'

import { decodeHashId, encodeHashId } from '../../../utils'
import { cacheUsersActions } from '../../cache'
import { getContext } from '../../effects'

import * as chatSelectors from './selectors'
import { actions as chatActions } from './slice'

const {
  createChat,
  createChatSucceeded,
  fetchMoreChats,
  fetchMoreChatsSucceeded,
  fetchMoreChatsFailed,
  fetchNewChatMessages,
  fetchNewChatMessagesSucceeded,
  fetchNewChatMessagesFailed,
  setMessageReaction,
  setMessageReactionSucceeded,
  markChatAsRead
} = chatActions
const { getChatsSummary, getChatMessagesSummary, getChat } = chatSelectors

function* doFetchMoreChats() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const summary = yield* select(getChatsSummary)
    const before = summary?.prev_cursor
    const response = yield* call([sdk.chats, sdk.chats!.getAll], {
      before
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

function* doFetchChatMessages(action: ReturnType<typeof fetchNewChatMessages>) {
  const { chatId } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const summary = yield* select((state) =>
      getChatMessagesSummary(state, chatId)
    )
    const after = summary?.next_cursor
    const response = yield* call([sdk.chats, sdk.chats!.getMessages], {
      chatId,
      after
    })
    yield* put(fetchNewChatMessagesSucceeded({ chatId, response }))
  } catch (e) {
    console.error('fetchNewChatMessagesFailed', e)
    yield* put(fetchNewChatMessagesFailed({ chatId }))
  }
}

function* doSetMessageReaction(action: ReturnType<typeof setMessageReaction>) {
  const { chatId, messageId, reaction } = action.payload
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
    yield* put(
      setMessageReactionSucceeded({
        ...action.payload,
        userId: user?.user_id,
        createdAt: dayjs().toISOString()
      })
    )
  } catch (e) {
    console.error('setMessageReactionFailed', e)
  }
}

function* doCreateChat(action: ReturnType<typeof createChat>) {
  const { userIds } = action.payload
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const user = yield* select(getAccountUser)
    if (!user) {
      throw new Error('User not found')
    }
    const res = yield* call([sdk.chats, sdk.chats.create], {
      userId: encodeHashId(user.user_id),
      invitedUserIds: userIds.map((id) => encodeHashId(id))
    })
    const chatId = (res as ChatCreateRPC).params.chat_id
    const { data: chat } = yield* call([sdk.chats, sdk.chats.get], { chatId })
    yield* put(createChatSucceeded({ chat }))
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
    if (!chat || chat?.unread_message_count > 0) {
      yield* call([sdk.chats, sdk.chats.read], { chatId })
    }
  } catch (e) {
    console.error('markChatAsReadFailed', e)
  }
}

function* watchFetchChats() {
  yield takeEvery(fetchMoreChats, doFetchMoreChats)
}

function* watchFetchChatMessages() {
  yield takeEvery(fetchNewChatMessages, doFetchChatMessages)
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

export const sagas = () => {
  return [
    watchFetchChats,
    watchFetchChatMessages,
    watchSetMessageReaction,
    watchCreateChat,
    watchMarkChatAsRead
  ]
}
