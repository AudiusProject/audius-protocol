import { call, put, select, takeEvery } from 'typed-redux-saga'

import { decodeHashId } from '../../../utils'
import { cacheUsersActions } from '../../cache'
import { getContext } from '../../effects'

import * as chatSelectors from './selectors'
import { actions as chatActions } from './slice'

const {
  fetchMoreChats,
  fetchMoreChatsSucceeded,
  fetchMoreChatsFailed,
  fetchNewChatMessages,
  fetchNewChatMessagesSucceeded,
  fetchNewChatMessagesFailed
} = chatActions
const { getChatsSummary, getChatMessagesSummary } = chatSelectors

function* doFetchMoreChats() {
  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const summary = yield* select(getChatsSummary)
    const cursor = summary?.next_cursor
    const response = yield* call([sdk.chats!, sdk.chats!.getAll], {
      cursor
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
    const after = summary?.prev_cursor
    const response = yield* call([sdk.chats!, sdk.chats!.getMessages], {
      chatId,
      after
    })
    yield* put(fetchNewChatMessagesSucceeded({ chatId, response }))
  } catch (e) {
    console.error('fetchNewChatMessagesFailed', e)
    yield* put(fetchNewChatMessagesFailed({ chatId }))
  }
}

function* watchFetchChats() {
  yield takeEvery(fetchMoreChats, doFetchMoreChats)
}

function* watchFetchChatMessages() {
  yield takeEvery(fetchNewChatMessages, doFetchChatMessages)
}

export const sagas = () => {
  return [watchFetchChats, watchFetchChatMessages]
}
