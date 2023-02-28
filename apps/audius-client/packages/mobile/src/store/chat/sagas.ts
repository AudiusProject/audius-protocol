import { chatActions } from '@audius/common'
import { takeLatest } from 'redux-saga/effects'

import { navigationRef } from 'app/components/navigation-container/NavigationContainer'

const { goToChat } = chatActions

function* watchGoToChat() {
  yield takeLatest(goToChat, function* (action: ReturnType<typeof goToChat>) {
    const {
      payload: { chatId }
    } = action
    if (navigationRef.isReady()) {
      // @ts-ignore navigationRef is not parametrized correctly (PAY-954)
      navigationRef.navigate('Chat', { chatId })
    }
  })
}

export default function sagas() {
  return [watchGoToChat]
}
