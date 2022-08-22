import { Name, toastActions } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { takeEvery, put } from 'redux-saga/effects'

import { make } from 'common/store/analytics/actions'
import { ERROR_PAGE } from 'utils/route'

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

  if (action.shouldRedirect) {
    if (action.redirectRoute) {
      yield put(pushRoute(action.redirectRoute))
    } else {
      yield put(
        make(Name.ERROR_PAGE, {
          error: action.message,
          name: action.name
        })
      )
      yield put(pushRoute(ERROR_PAGE))
    }
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
