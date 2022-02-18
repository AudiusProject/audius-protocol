import { push as pushRoute, goBack } from 'connected-react-router'
import { put, takeEvery } from 'redux-saga/effects'

import { MessageType, Message } from 'services/native-mobile-interface/types'

function* watchPushRoute() {
  yield takeEvery(MessageType.PUSH_ROUTE, function* (action: Message) {
    const { route, fromPage, fromNativeNotifications = true } = action
    if (route) {
      yield put(
        pushRoute(route, {
          noAnimation: true,
          fromNativeNotifications,
          fromPage
        })
      )
    }
  })
}

function* watchPopRoute() {
  yield takeEvery(MessageType.POP_ROUTE, function* () {
    yield put(goBack())
  })
}

function* watchScrollToTop() {
  yield takeEvery(MessageType.SCROLL_TO_TOP, function* () {
    window.scrollTo(0, 0)
  })
}

const sagas = () => {
  return [watchPushRoute, watchPopRoute, watchScrollToTop]
}

export default sagas
