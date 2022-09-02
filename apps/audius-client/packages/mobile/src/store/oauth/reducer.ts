import type { MessageType } from 'app/message'

import type { OAuthActions } from './actions'
import {
  NATIVE_OPEN_POPUP,
  CLOSE_POPUP,
  SET_TWITTER_INFO,
  SET_INSTAGRAM_INFO,
  SET_TWITTER_ERROR,
  SET_INSTAGRAM_ERROR,
  RESET_OAUTH_STATE
} from './actions'

type TwitterInfo = {
  uuid: any
  profile: any
  profileImage: any
  profileBanner: any
  requiresUserReview: any
  twitterId?: any
}

type InstagramInfo = {
  uuid: any
  profile: any
  profileImage: any
  requiresUserReview: any
  instagramId?: any
}

export type OAuthState = {
  isOpen: boolean
  // Incoming message id to reply back to with OAuth results
  messageId: string | null
  messageType: MessageType | null
  url: string | null
  provider: Provider | null
  twitterInfo: TwitterInfo | null
  twitterError: any
  instagramInfo: InstagramInfo | null
  instagramError: any
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
  instagramError: null
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
        provider: action.provider
      }
    case CLOSE_POPUP:
      return {
        ...state,
        isOpen: false,
        messageId: null,
        messageType: null,
        url: null,
        provider: null
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
    case RESET_OAUTH_STATE:
      return { ...initialState }
    default:
      return state
  }
}

export default reducer
