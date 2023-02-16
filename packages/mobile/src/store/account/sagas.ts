import {
  accountActions,
  getContext,
  SquareSizes,
  WidthSizes
} from '@audius/common'
import accountSagas from 'common/store/account/sagas'
import { updateProfileAsync } from 'common/store/profile/sagas'
import { Image } from 'react-native'
import { takeEvery, call } from 'typed-redux-saga'

import { IS_MOBILE_USER } from 'app/constants/storage-keys'
import { getImageSourceOptimistic } from 'app/hooks/useContentNodeImage'
const { signedIn } = accountActions

// const RESET_REQUIRED_KEY = 'password-reset-required'

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

/**
 * Prefetch and cache the profile and cover photos so they are available offline
 */
function* cacheUserImages(account) {
  try {
    const profileImageUrl = getImageSourceOptimistic({
      cid: account.profile_picture_sizes,
      user: account,
      size: SquareSizes.SIZE_150_BY_150
    })?.uri

    if (profileImageUrl) {
      yield call(Image.prefetch, profileImageUrl)
    }

    const coverPhotoUrl = getImageSourceOptimistic({
      cid: account.cover_photo_sizes,
      user: account,
      size: WidthSizes.SIZE_640
    })?.uri

    if (coverPhotoUrl) {
      yield call(Image.prefetch, coverPhotoUrl)
    }
  } catch {
    console.error('Could not cache profile images')
  }
}

// When successfully signed in
function* onSignedIn({ payload: { account } }: ReturnType<typeof signedIn>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const localStorage = yield* getContext('localStorage')
  const isMobileUser = yield* call(localStorage.getItem, IS_MOBILE_USER)

  yield call(cacheUserImages, account)

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

      yield call(localStorage.setItem, IS_MOBILE_USER, 'true')
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
