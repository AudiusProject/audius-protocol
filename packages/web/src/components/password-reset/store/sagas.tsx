import { getContext } from '@audius/common/store'
import { call, put, takeEvery } from 'redux-saga/effects'

import * as actions from './actions'

function* watchChangePassword() {
  const authService = yield* getContext('authService')
  yield takeEvery(
    actions.CHANGE_PASSWORD,
    function* (action: actions.ChangePasswordAction) {
      try {
        yield call(authService.resetPassword, {
          username: action.email,
          password: action.password
        })
      } catch (e) {
        yield put(actions.changePasswordFailed())
      }
      yield put(actions.changePasswordSucceeded())
    }
  )
}

export default function sagas() {
  return [watchChangePassword]
}
