import { TikTokProfile , Image } from '@audius/common/store'
     import type {  } from '@audius/common'

import type { OAuthActions } from './actions'
import {
  SET_TIKTOK_ERROR,
  SET_TIKTOK_INFO,
  NATIVE_OPEN_POPUP,
  CLOSE_POPUP,
  SET_TWITTER_INFO,
  SET_INSTAGRAM_INFO,
  SET_TWITTER_ERROR,
  SET_INSTAGRAM_ERROR,
  RESET_OAUTH_STATE
} from './actions'
import type { AUTH_RESPONSE_MESSAGE_TYPE } from './types'

export type TwitterInfo = {
  uuid: any
  profile: any
  profileImage: Image
  profileBanner: any
  requiresUserReview: any
  twitterId?: any
}

export type InstagramInfo = {
  uuid: any
  profile: any
  profileImage: Image
  requiresUserReview: any
  instagramId?: any
}

type TikTokInfo = {
  uuid: string
  profile: TikTokProfile
  profileImage: Image | undefined
  requiresUserReview: boolean
}

export type OAuthState = {
  isOpen: boolean
  // Incoming message id to reply back to with OAuth results
  messageId: string | null
  messageType: typeof AUTH_RESPONSE_MESSAGE_TYPE | null
  url: string | null
  provider: Provider | null
  twitterInfo: TwitterInfo | null
  twitterError: any
  instagramInfo: InstagramInfo | null
  instagramError: any
  tikTokInfo: TikTokInfo | null
  tikTokError: any
  // Whether the user canceled out of the oauth flow
  abandoned: boolean
}

export enum Provider {
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK'
}

const initialState: OAuthState = {
  isOpen: false,
  messageId: null,
  messageType: null,
  url: null,
  provider: null,
  twitterInfo: null,
  twitterError: null,
  instagramInfo: null,
  instagramError: null,
  tikTokInfo: null,
  tikTokError: null,
  abandoned: false
}

const reducer = (
  state: OAuthState = initialState,
  action: OAuthActions
): OAuthState => {
  switch (action.type) {
    case NATIVE_OPEN_POPUP:
      return {
        ...state,
        isOpen: true,
        url: action.url,
        provider: action.provider,
        abandoned: false
      }
    case CLOSE_POPUP:
      return {
        ...state,
        isOpen: false,
        messageId: null,
        messageType: null,
        url: null,
        provider: null,
        abandoned: action.abandoned
      }
    case SET_TWITTER_INFO:
      return {
        ...state,
        twitterInfo: { ...action }
      }
    case SET_TWITTER_ERROR:
      return {
        ...state,
        twitterError: action.error
      }
    case SET_INSTAGRAM_INFO:
      return {
        ...state,
        instagramInfo: { ...action }
      }
    case SET_INSTAGRAM_ERROR:
      return {
        ...state,
        instagramError: action.error
      }
    case SET_TIKTOK_INFO:
      return {
        ...state,
        tikTokInfo: { ...action }
      }
    case SET_TIKTOK_ERROR:
      return {
        ...state,
        tikTokError: action.error
      }
    case RESET_OAUTH_STATE:
      return { ...initialState }
    default:
      return state
  }
}

export default reducer
