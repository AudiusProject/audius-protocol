import { accountActions, getContext } from '@audius/common'
import accountSagas from 'common/store/account/sagas'
import { updateProfileAsync } from 'common/store/profile/sagas'
import { takeEvery, call } from 'typed-redux-saga'
const { signedIn } = accountActions

export const RESET_REQUIRED_KEY = 'password-reset-required'
export const ENTROPY_KEY = 'hedgehog-entropy-key'
export const IS_MOBILE_USER_KEY = 'is-mobile-user'

// TODO
// Account recovery coming in following pr
// function* watchAccountRecovery() {
//   yield takeEvery(
//     MessageType.ACCOUNT_RECOVERY,
//     function* ({ login, warning, email }: any) {
//       let entropy: Nullable<string> = null
//       let isSameAccount = false

//       if (login) {
//         entropy = atob(login)
//         const oldEntropy = window.localStorage.getItem(ENTROPY_KEY)
//         window.localStorage.setItem(ENTROPY_KEY, entropy ?? '')
//         isSameAccount = oldEntropy === entropy
//       }

//       if (warning === 'RECOVERY_DO_NOT_SHARE' && email) {
//         window.localStorage.setItem(RESET_REQUIRED_KEY, email)
//       }

//       // If it's not the same account,
//       // reload webview to reload libs
//       // with the new entropy
//       if (!isSameAccount) {
//         new ReloadMessage().send()
//       } else {
//         yield put(setNeedsAccountRecovery())
//       }
//     }
//   )
// }

// When successfully signed in
function* onSignedIn({
  payload: { account, isSignUp }
}: ReturnType<typeof signedIn>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const localStorage = yield* getContext('localStorage')
  const isMobileUser = yield* call(localStorage.getItem, IS_MOBILE_USER_KEY)
  if (!isMobileUser || isMobileUser !== 'true') {
    try {
      // Legacy method to update whether a user has signed in on
      // native mobile. Used in identity service for notification indexing
      yield call(audiusBackendInstance.updateUserEvent, {
        hasSignedInNativeMobile: true
      })
      // Updates the user metadata with an event `is_mobile_user` set to true
      // if the account is being fetched from a mobile context
      yield call(updateProfileAsync, {
        metadata: { ...account, events: { is_mobile_user: true } }
      })

      yield call(localStorage.setItem, IS_MOBILE_USER_KEY, 'true')
    } catch (e) {
      console.error(e)
      // Do nothing. A retry on the next session will suffice.
    }
  }
}

function* watchSignedIn() {
  yield* takeEvery(signedIn.type, onSignedIn)
}

const sagas = () => {
  return [...accountSagas(), watchSignedIn]
}

export default sagas
