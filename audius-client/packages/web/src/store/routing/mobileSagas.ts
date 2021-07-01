import { push as pushRoute } from 'connected-react-router'
import { put, takeEvery } from 'redux-saga/effects'

import { MessageType, Message } from 'services/native-mobile-interface/types'

function* watchPushRoute() {
  yield takeEvery(MessageType.PUSH_ROUTE, function* (action: Message) {
    const { route, fromPage } = action
    if (route) {
      yield put(
        pushRoute(route, {
          noAnimation: true,
          fromNativeNotifications: true,
          fromPage
        })
      )
    }
  })
}

const sagas = () => {
  return [watchPushRoute]
}

export default sagas
