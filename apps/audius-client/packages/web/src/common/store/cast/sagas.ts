import { takeEvery } from 'redux-saga/effects'

import { CAST_METHOD, updateMethod } from './slice'

function* watchUpdateCastMethod() {
  yield takeEvery(updateMethod.type, function* (
    action: ReturnType<typeof updateMethod>
  ) {
    const { method } = action.payload
    window.localStorage.setItem(CAST_METHOD, method)
  })
}

export const sagas = () => {
  return [watchUpdateCastMethod]
}
