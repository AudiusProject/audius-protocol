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

function* watchScrollToTop() {
  yield takeEvery(MessageType.SCROLL_TO_TOP, function* () {
    window.scrollTo(0, 0)
  })
}

const sagas = () => {
  return [watchPushRoute, watchScrollToTop]
}

export default sagas
