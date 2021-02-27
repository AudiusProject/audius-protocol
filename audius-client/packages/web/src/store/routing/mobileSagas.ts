import { put, takeEvery } from 'redux-saga/effects'

import { MessageType, Message } from 'services/native-mobile-interface/types'
import { push as pushRoute } from 'connected-react-router'

function* watchPushRoute() {
  yield takeEvery(MessageType.PUSH_ROUTE, function* (action: Message) {
    const { route } = action
    if (route) {
      yield put(
        pushRoute(route, { noAnimation: true, fromNativeNotifications: true })
      )
    }
  })
}

const sagas = () => {
  return [watchPushRoute]
}

export default sagas
