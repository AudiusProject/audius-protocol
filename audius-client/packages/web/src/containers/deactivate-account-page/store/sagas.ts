import { delay } from 'redux-saga'
import { call, put, select, takeEvery } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import { Nullable } from 'common/utils/typeUtils'
import AudiusBackend from 'services/AudiusBackend'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import { requestConfirmation } from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { getConfirmCalls } from 'store/confirmer/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import { signOut } from 'utils/signOut'

import {
  afterDeactivationSignOut,
  deactivateAccount,
  deactivateAccountFailed
} from './slice'

const DEACTIVATE_CONFIRMATION_UID = 'DEACTIVATE'

function* handleDeactivateAccount() {
  try {
    yield call(waitForBackendSetup)
    const accountUserId: Nullable<ID> = yield select(getUserId)
    const userMetadata: ReturnType<typeof getAccountUser> = yield select(
      getAccountUser
    )
    yield put(
      requestConfirmation(
        DEACTIVATE_CONFIRMATION_UID,
        function* () {
          yield put(make(Name.DEACTIVATE_ACCOUNT_REQUEST, {}))
          const { blockHash, blockNumber } = yield call(
            AudiusBackend.updateCreator,
            { ...userMetadata, is_deactivated: true },
            accountUserId /* note: as of writing, unused parameter */
          )
          const confirmed: boolean = yield call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(
              `Could not confirm account deactivation for user ${accountUserId}`
            )
          }
        },
        // @ts-ignore: confirmer is untyped
        function* () {
          yield put(make(Name.DEACTIVATE_ACCOUNT_SUCCESS, {}))
          // Do the signout in another action so confirmer can clear
          yield put(afterDeactivationSignOut())
        },
        function* () {
          yield put(make(Name.DEACTIVATE_ACCOUNT_FAILURE, {}))
          yield put(deactivateAccountFailed())
        }
      )
    )
  } catch (e) {
    console.error(e)
    yield put(make(Name.DEACTIVATE_ACCOUNT_FAILURE, {}))
    yield put(deactivateAccountFailed())
  }
}

function* waitAndSignOut() {
  // Wait for all confirmations to end so that reloading doesn't trigger beforeUnload dialog
  // Note: Waiting for getIsConfirming doesn't appear to work here
  yield call(waitForValue, getConfirmCalls, {}, confirmCalls => {
    return Object.keys(confirmCalls).length === 0
  })
  // Give a brief delay to allow the beforeUnload handler to clear
  yield delay(10)
  yield call(signOut)
}

function* watchDeactivateAccount() {
  yield takeEvery(deactivateAccount, handleDeactivateAccount)
}
function* watchAfterDeactivationSignOut() {
  yield takeEvery(afterDeactivationSignOut, waitAndSignOut)
}

export default function sagas() {
  return [watchDeactivateAccount, watchAfterDeactivationSignOut]
}
