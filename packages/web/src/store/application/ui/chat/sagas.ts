import { chatActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { takeLatest } from 'redux-saga/effects'
import { put } from 'typed-redux-saga'

import { push } from 'utils/navigation'
import { chatPage } from 'utils/route'

const { CHATS_PAGE } = route
const { goToChat } = chatActions

function* watchGoToChat() {
  yield takeLatest(goToChat, function* (action: ReturnType<typeof goToChat>) {
    const {
      payload: { chatId, presetMessage }
    } = action
    if (!chatId) {
      yield* put(push(CHATS_PAGE))
    } else {
      yield* put(push(chatPage(chatId), { presetMessage }))
    }
  })
}

export default function sagas() {
  return [watchGoToChat]
}
