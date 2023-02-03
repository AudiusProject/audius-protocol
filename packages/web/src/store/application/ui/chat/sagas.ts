import { chatActions, modalsActions } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { takeLatest } from 'redux-saga/effects'
import { put } from 'typed-redux-saga'

import { chatPage } from 'utils/route'

const { createChatSucceeded } = chatActions
const { setVisibility } = modalsActions

function* watchCreateChatSucceeded() {
  yield takeLatest(
    createChatSucceeded,
    function* (action: ReturnType<typeof createChatSucceeded>) {
      const {
        payload: { chat }
      } = action
      yield* put(setVisibility({ modal: 'CreateChat', visible: false }))
      yield* put(pushRoute(chatPage(chat.chat_id)))
    }
  )
}

export default function sagas() {
  return [watchCreateChatSucceeded]
}
