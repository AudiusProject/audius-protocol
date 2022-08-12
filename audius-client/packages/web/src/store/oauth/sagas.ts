import { RemoteConfigInstance, StringKeys } from '@audius/common'
import * as Sentry from '@sentry/browser'
import { takeEvery } from 'redux-saga/effects'

import { getContext } from 'common/store'
import {
  formatInstagramProfile,
  formatTwitterProfile
} from 'pages/sign-on/utils/formatSocialProfile'
import {
  RequestInstagramAuthFailureMessage,
  RequestInstagramAuthMessage,
  RequestInstagramAuthSuccessMessage,
  RequestTwitterAuthFailureMessage,
  RequestTwitterAuthMessage,
  RequestTwitterAuthSuccessMessage
} from 'services/native-mobile-interface/oauth'
import * as oauthActions from 'store/oauth/actions'

import mobileSagas from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const IDENTITY_SERVICE = process.env.REACT_APP_IDENTITY_SERVICE
const INSTAGRAM_APP_ID = process.env.REACT_APP_INSTAGRAM_APP_ID
const INSTAGRAM_REDIRECT_URL =
  process.env.REACT_APP_INSTAGRAM_REDIRECT_URL || ''

const INSTAGRAM_AUTHORIZE_URL = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
  INSTAGRAM_REDIRECT_URL
)}&scope=user_profile,user_media&response_type=code`

// Route to fetch instagram user data w/ the username
const getIGUserUrl = (endpoint: string, username: string) => {
  const url = endpoint.replace('$USERNAME$', username)
  return url
}

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
  credentials: CredentialsType
  onSuccess: (response: any) => void
  onFailure: (error: any) => void
}

const getOauthToken = (
  loginUrl: string,
  oAuthVerifier: string,
  oauthToken: string,
  headers: any,
  credentials: CredentialsType,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  return window
    .fetch(
      `${loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`,
      {
        method: 'POST',
        credentials,
        headers
      }
    )
    .then((response) => {
      onSuccess(response)
    })
    .catch((error) => {
      return onFailure(error.message)
    })
}

const doTwitterAuth = async ({
  loginUrl,
  requestTokenUrl,
  forceLogin,
  screenName,
  credentials,
  headers,
  onSuccess,
  onFailure
}: TwitterNativeMobileAuthProps) => {
  try {
    const tokenResp = await window.fetch(requestTokenUrl, {
      method: 'POST',
      credentials,
      headers
    })
    const tokenRespJson = await tokenResp.json()
    let authenticationUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${tokenRespJson.oauth_token}&force_login=${forceLogin}`

    if (screenName) {
      authenticationUrl = `${authenticationUrl}&screen_name=${screenName}`
    }

    const message = new RequestTwitterAuthMessage(authenticationUrl)
    message.send()
    const response = await message.receive()
    const { oauthVerifier, oauthToken } = response
    if (oauthVerifier && oauthToken) {
      return getOauthToken(
        loginUrl,
        oauthVerifier,
        oauthToken,
        headers,
        credentials,
        onSuccess,
        onFailure
      )
    } else {
      onFailure('Failed oauth')
    }
  } catch (error) {
    onFailure((error as any).message)
  }
}

function* watchTwitterAuth() {
  yield takeEvery(oauthActions.REQUEST_TWITTER_AUTH, function* () {
    const onFailure = (error: any) => {
      console.error(error)
      const message = new RequestTwitterAuthFailureMessage({
        error
      })
      message.send()
    }

    const onSuccess = async (twitterProfileRes: any) => {
      const { uuid, profile: twitterProfile } = await twitterProfileRes.json()
      try {
        const { profile, profileImage, profileBanner, requiresUserReview } =
          await formatTwitterProfile(twitterProfile)
        const message = new RequestTwitterAuthSuccessMessage({
          uuid,
          profile,
          profileImage,
          profileBanner,
          requiresUserReview
        })
        message.send()
      } catch (error) {
        onFailure((error as any).message)
      }
    }

    const props = {
      loginUrl: `${IDENTITY_SERVICE}/twitter/callback`,
      requestTokenUrl: `${IDENTITY_SERVICE}/twitter`,
      forceLogin: true,
      screenName: '',
      credentials: 'same-origin' as CredentialsType,
      headers: {
        'Content-Type': 'application/json'
      },
      onSuccess,
      onFailure
    }
    doTwitterAuth(props)
  })
}

type InstagramNativeMobileAuthProps = {
  onSuccess: (username: string, profile: any) => void
  onFailure: (error: any) => void
  remoteConfigInstance: RemoteConfigInstance
}

const getProfile = async (
  code: string,
  onSuccess: (username: string, profile: any) => void,
  onFailure: (error: any) => void,
  remoteConfigInstance: RemoteConfigInstance
) => {
  try {
    const profileResp = await window.fetch(`${IDENTITY_SERVICE}/instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    const profileRespJson = await profileResp.json()
    if (!profileRespJson.username) {
      return onFailure('Unable to fetch information')
    }
    const profileEndpoint =
      remoteConfigInstance.getRemoteVar(StringKeys.INSTAGRAM_API_PROFILE_URL) ||
      'https://instagram.com/$USERNAME$/?__a=1'
    const fetchIGUserUrl = getIGUserUrl(
      profileEndpoint,
      profileRespJson.username
    )
    const igProfile = await window.fetch(fetchIGUserUrl)
    const igProfileJson = await igProfile.json()
    if (!igProfileJson.graphql || !igProfileJson.graphql.user) {
      return onFailure('Unable to fetch information')
    }
    const igUserProfile = igUserFields.reduce((profile: any, field) => {
      profile[field] = igProfileJson.graphql.user[field]
      return profile
    }, {})

    const setProfileResponse = await window.fetch(
      `${IDENTITY_SERVICE}/instagram/profile`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: igUserProfile })
      }
    )

    if (!setProfileResponse.ok) {
      return onFailure('Unable to fetch information')
    }

    return onSuccess(igUserProfile.username, igUserProfile)
  } catch (error) {
    onFailure((error as any).message)
    Sentry.captureException(`Instagram getProfile failed with ${error}`)
  }
}

const doInstagramAuth = async ({
  onSuccess,
  onFailure,
  remoteConfigInstance
}: InstagramNativeMobileAuthProps) => {
  try {
    const message = new RequestInstagramAuthMessage(INSTAGRAM_AUTHORIZE_URL)
    message.send()
    const response = await message.receive()
    if (response.code) {
      return await getProfile(
        response.code,
        onSuccess,
        onFailure,
        remoteConfigInstance
      )
    } else {
      onFailure('Unable to retrieve information')
    }
  } catch (error) {
    onFailure((error as any).message)
  }
}

function* watchInstagramAuth() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield takeEvery(oauthActions.REQUEST_INSTAGRAM_AUTH, function* () {
    const onFailure = (error: any) => {
      console.error(error)
      const message = new RequestInstagramAuthFailureMessage({ error })
      message.send()
    }

    const onSuccess = async (uuid: string, instagramProfile: any) => {
      try {
        const { profile, profileImage, requiresUserReview } =
          await formatInstagramProfile(instagramProfile)
        const message = new RequestInstagramAuthSuccessMessage({
          uuid,
          profile,
          profileImage,
          requiresUserReview
        })
        message.send()
      } catch (error) {
        onFailure((error as any).message)
      }
    }
    const props = {
      onSuccess,
      onFailure,
      remoteConfigInstance
    }
    doInstagramAuth(props)
  })
}

const sagas = () => {
  const sagas = [watchTwitterAuth, watchInstagramAuth]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
