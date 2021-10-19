import { put, takeEvery } from 'redux-saga/effects'

import { MessageType } from 'services/native-mobile-interface/types'

import { show } from './slice'

function* watchEnablePushNotificationsReminder() {
  yield takeEvery(MessageType.ENABLE_PUSH_NOTIFICATIONS_REMINDER, function* () {
    yield put(show())
  })
}

const sagas = () => {
  return [watchEnablePushNotificationsReminder]
}

export default sagas
