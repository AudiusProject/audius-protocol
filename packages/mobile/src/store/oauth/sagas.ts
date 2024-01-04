import type { RemoteConfigInstance } from '@audius/common'
import {
  getContext,
  formatInstagramProfile,
  formatTwitterProfile
} from '@audius/common'
import * as Sentry from '@sentry/react-native'
import { takeEvery, put, takeLatest, call } from 'redux-saga/effects'

import * as oauthActions from './actions'
import type {
  RequestNativeOpenPopupAction,
  SetCredentialsAction
} from './actions'
import { Provider } from './reducer'
import type { TwitterCredentials, InstagramCredentials } from './types'

// Instagram User profile fields to capture
const igUserFields = [
  'id',
  'username',
  'biography',
  'full_name',
  'is_verified',
  'is_private',
  'external_url',
  'business_email',
  'is_business_account',
  'profile_pic_url',
  'profile_pic_url_hd',
  'edge_followed_by',
  'edge_follow'
]

type CredentialsType = 'omit' | 'same-origin' | 'include'

type TwitterNativeMobileAuthProps = {
  loginUrl: string
  requestTokenUrl: string
  forceLogin: boolean
  screenName: string
  headers: any
  credentialsType: CredentialsType
  onSuccess: (response: any) => void
  onFailure: (error: any) => void
}

function* getOauthToken(
  loginUrl: string,
  oAuthVerifier: string,
  oauthToken: string,
  headers: any,
  credentialsType: CredentialsType
) {
  try {
    const response = yield call(
      fetch as any,
      `${loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`,
      {
        method: 'POST',
        credentialsType,
        headers
      }
    )
    return response
  } catch (error) {
    console.error(error)
    throw new Error(error.message)
  }
}

function* doTwitterAuth({
  loginUrl,
  requestTokenUrl,
  forceLogin,
  screenName,
  credentialsType,
  headers,
  onSuccess,
  onFailure
}: TwitterNativeMobileAuthProps) {
  try {
    const tokenResp = yield call(fetch as any, requestTokenUrl, {
      method: 'POST',
      credentialsType,
      headers
    })
    const tokenRespJson = yield tokenResp.json()
    let authenticationUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${tokenRespJson.oauth_token}&force_login=${forceLogin}`

    if (screenName) {
      authenticationUrl = `${authenticationUrl}&screen_name=${screenName}`
    }

    yield put(oauthActions.nativeOpenPopup(authenticationUrl, Provider.TWITTER))

    yield takeLatest(
      oauthActions.SET_CREDENTIALS,
      function* ({ credentials }: SetCredentialsAction) {
        if (!credentials.error) {
          const { oauthVerifier, oauthToken } =
            credentials as TwitterCredentials
          if (oauthVerifier && oauthToken) {
            try {
              const token = yield call(
                getOauthToken,
                loginUrl,
                oauthVerifier,
                oauthToken,
                headers,
                credentialsType
              )
              yield call(onSuccess, token)
            } catch (e) {
              yield call(onFailure, e)
            }
          } else {
            yield call(onFailure, 'Failed oauth')
          }
        } else {
          yield call(onFailure, new Error(credentials.error).message)
        }
      }
    )
  } catch (error) {
    yield call(onFailure, (error as any).message)
  }
}

function* watchTwitterAuth() {
  const { IDENTITY_SERVICE, AUDIUS_URL } = yield getContext('env')
  yield takeEvery(oauthActions.REQUEST_TWITTER_AUTH, function* () {
    function* onFailure(error: any) {
      console.error(error)
      yield put(oauthActions.setTwitterError(error))
      Sentry.captureException(`Twitter getProfile failed with ${error}`)
    }

    function* onSuccess(twitterProfileRes: any) {
      const { uuid, profile: twitterProfile } = yield twitterProfileRes.json()
      try {
        const { profile, profileImage, profileBanner, requiresUserReview } =
          yield call(
            formatTwitterProfile,
            twitterProfile,
            async (image) => image
          )
        yield put(
          oauthActions.setTwitterInfo(
            uuid,
            profile,
            profileImage,
            profileBanner,
            requiresUserReview
          )
        )
      } catch (error) {
        yield call(onFailure, (error as any).message)
      }
    }

    yield call(doTwitterAuth, {
      loginUrl: `${IDENTITY_SERVICE}/twitter/callback`,
      requestTokenUrl: `${IDENTITY_SERVICE}/twitter`,
      forceLogin: true,
      screenName: '',
      credentialsType: 'same-origin' as CredentialsType,
      headers: {
        'Content-Type': 'application/json',
        origin: AUDIUS_URL,
        referrer: AUDIUS_URL
      },
      onSuccess,
      onFailure
    })
  })
}

type InstagramNativeMobileAuthProps = {
  onSuccess: (username: string, profile: any) => void
  onFailure: (error: any) => void
  remoteConfigInstance: RemoteConfigInstance
}

export const getInstagramProfile = async (
  code: string,
  identityService: string
) => {
  try {
    const profileResp = await fetch(`${identityService}/instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    const profileRespJson = await profileResp.json()
    if (!profileRespJson.username) {
      throw new Error(profileRespJson.error || 'Unable to fetch information')
    }
    const igUserProfile = igUserFields.reduce((profile: any, field) => {
      profile[field] = profileRespJson[field]
      return profile
    }, {})
    return { username: igUserProfile.username, igUserProfile }
  } catch (error) {
    Sentry.captureException(`Instagram getProfile failed with ${error}`)
    throw new Error((error as any).message)
  }
}

function* doInstagramAuth({
  onSuccess,
  onFailure
}: InstagramNativeMobileAuthProps) {
  const instagramAppId = yield getContext('instagramAppId')
  const instagramRedirectUrl = yield getContext('instagramRedirectUrl')
  const { IDENTITY_SERVICE } = yield getContext('env')
  const instagramAuthorizeUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(
    instagramRedirectUrl
  )}&scope=user_profile,user_media&response_type=code`

  try {
    yield put(
      oauthActions.nativeOpenPopup(instagramAuthorizeUrl, Provider.INSTAGRAM)
    )

    yield takeLatest(
      oauthActions.SET_CREDENTIALS,
      function* ({ credentials }: SetCredentialsAction) {
        if (!credentials.error) {
          const { code } = credentials as InstagramCredentials
          if (code) {
            try {
              const { username, igUserProfile } = yield call(
                getInstagramProfile,
                code,
                IDENTITY_SERVICE
              )
              yield call(onSuccess, username, igUserProfile)
            } catch (e) {
              yield call(onFailure, e)
            }
          } else {
            yield call(onFailure, 'Unable to retrieve information')
          }
        } else {
          yield call(onFailure, new Error(credentials.error).message)
        }
      }
    )
  } catch (error) {
    yield call(onFailure, (error as any).message)
  }
}

function* watchInstagramAuth() {
  const remoteConfigInstance = yield getContext('remoteConfigInstance')
  const { GENERAL_ADMISSION } = yield getContext('env')
  yield takeEvery(oauthActions.REQUEST_INSTAGRAM_AUTH, function* () {
    function* onFailure(error: any) {
      console.error(error)
      yield put(oauthActions.setInstagramError(error))
    }

    function* onSuccess(uuid: string, instagramProfile: any) {
      try {
        const { profile, profileImage, requiresUserReview } = yield call(
          formatInstagramProfile,
          instagramProfile,
          GENERAL_ADMISSION,
          async (image: File) => image
        )
        yield put(
          oauthActions.setInstagramInfo(
            uuid,
            profile,
            profileImage,
            requiresUserReview
          )
        )
      } catch (error) {
        yield call(onFailure, (error as any).message)
      }
    }

    yield call(doInstagramAuth, {
      onSuccess,
      onFailure,
      remoteConfigInstance
    })
  })
}

/**
 * Used in conjunction with the useTikTokAuth hook
 */
function* watchRequestNativeOpenPopup() {
  yield takeLatest(
    oauthActions.REQUEST_NATIVE_OPEN_POPUP,
    function* ({
      resolve,
      reject,
      url,
      provider
    }: RequestNativeOpenPopupAction) {
      yield put(oauthActions.nativeOpenPopup(url, provider))

      yield takeLatest(
        oauthActions.SET_CREDENTIALS,
        function* ({ credentials }: SetCredentialsAction) {
          if (!credentials.error) {
            resolve(credentials)
          } else {
            reject(new Error(credentials.error))
          }
        }
      )
    }
  )
}

const sagas = () => {
  return [watchTwitterAuth, watchInstagramAuth, watchRequestNativeOpenPopup]
}

export default sagas
