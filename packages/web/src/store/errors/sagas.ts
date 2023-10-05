import { toastActions } from '@audius/common'
import { takeEvery, put } from 'redux-saga/effects'

import * as errorActions from './actions'
import { reportToSentry } from './reportToSentry'
const { toast } = toastActions

function* handleError(action: errorActions.HandleErrorAction) {
  console.debug(`Handling error: ${action.message}`)
  if (action.shouldReport) {
    reportToSentry({
      level: action.level,
      additionalInfo: action.additionalInfo,
      error: new Error(action.message),
      name: action.name
    })
  }

  if (action.shouldToast) {
    yield put(toast({ content: action.message }))
  }
}

function* watchHandleError() {
  yield takeEvery(errorActions.HANDLE_ERROR, handleError)
}

export default function sagas() {
  return [watchHandleError]
}
