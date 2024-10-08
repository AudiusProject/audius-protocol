import { purchasersUserListActions } from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_PURCHASERS_ERROR, getPurchasersError } = purchasersUserListActions

type HandlePurchasersError = ReturnType<typeof getPurchasersError>

export function* handlePurchasersError(action: HandlePurchasersError) {
  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect: true,
      shouldReport: true,
      additionalInfo: {
        errorMessage: action.error,
        id: action.id
      }
    })
  )
}

export function* watchPurchasersError() {
  yield takeEvery([GET_PURCHASERS_ERROR], handlePurchasersError)
}
