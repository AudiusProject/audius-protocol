import type {
  InstagramAccountPayload,
  TwitterProfile,
  TikTokProfile,
  Image
} from '@audius/common'

import type { Provider } from './reducer'
import type { Credentials } from './types'

export const REQUEST_TWITTER_AUTH = 'OAUTH/REQUEST_TWITTER_AUTH'
export const REQUEST_INSTAGRAM_AUTH = 'OAUTH/REQUEST_INSTAGRAM_AUTH'
export const REQUEST_TIKTOK_AUTH = 'OAUTH/REQUEST_TIKTOK_AUTH'
export const OPEN_POPUP = 'OAUTH/OPEN_POPUP'
export const REQUEST_NATIVE_OPEN_POPUP = 'OAUTH/REQUEST_NATIVE_OPEN_POPUP'
export const SET_CREDENTIALS = 'OAUTH/SET_CREDENTIALS'
export const NATIVE_OPEN_POPUP = 'OAUTH/NATIVE_OPEN_POPUP'
export const CLOSE_POPUP = 'OAUTH/CLOSE_POPUP'
export const SET_TWITTER_INFO = 'OAUTH/SET_TWITTER_INFO'
export const SET_TWITTER_ERROR = 'OAUTH/SET_TWITTER_ERROR'
export const SET_INSTAGRAM_INFO = 'OAUTH/SET_INSTAGRAM_INFO'
export const SET_INSTAGRAM_ERROR = 'OAUTH/SET_INSTAGRAM_ERROR'
export const SET_TIKTOK_INFO = 'OAUTH/SET_TIKTOK_INFO'
export const SET_TIKTOK_ERROR = 'OAUTH/SET_TIKTOK_ERROR'
export const RESET_OAUTH_STATE = 'OAUTH/RESET_OAUTH_STATE'

type RequestTwitterAuthAction = {
  type: typeof REQUEST_TWITTER_AUTH
}

type RequestInstagramAuthAction = {
  type: typeof REQUEST_INSTAGRAM_AUTH
}

type RequestTikTokAuthAction = {
  type: typeof REQUEST_TIKTOK_AUTH
}

export type RequestNativeOpenPopupAction = {
  type: typeof REQUEST_NATIVE_OPEN_POPUP
  resolve: (c: Credentials | PromiseLike<Credentials>) => void
  reject: (e: Error) => void
  url: string
  provider: Provider
}
export type SetCredentialsAction = {
  type: typeof SET_CREDENTIALS
  credentials: Credentials
}
type NativeOpenPopupAction = {
  type: typeof NATIVE_OPEN_POPUP
  url: string
  provider: Provider
}
type ClosePopupAction = {
  type: typeof CLOSE_POPUP
  abandoned: boolean
}

type SetTwitterInfoAction = {
  type: typeof SET_TWITTER_INFO
  uuid: any
  profile: TwitterProfile
  profileImage: Image
  profileBanner: Image | undefined
  requiresUserReview: any
}
type SetTwitterErrorAction = {
  type: typeof SET_TWITTER_ERROR
  error: any
}

type SetInstagramInfoAction = {
  type: typeof SET_INSTAGRAM_INFO
  uuid: any
  profile: InstagramAccountPayload
  profileImage: Image
  requiresUserReview: any
}
type SetInstagramErrorAction = {
  type: typeof SET_INSTAGRAM_ERROR
  error: any
}

type SetTikTokInfoAction = {
  type: typeof SET_TIKTOK_INFO
  uuid: any
  profile: TikTokProfile
  profileImage: Image | undefined
  requiresUserReview: any
}
type SetTikTokErrorAction = {
  type: typeof SET_TIKTOK_ERROR
  error: any
}

type ResetOAuthStateAction = {
  type: typeof RESET_OAUTH_STATE
}

export type OAuthActions =
  | RequestTwitterAuthAction
  | RequestInstagramAuthAction
  | RequestTikTokAuthAction
  | RequestNativeOpenPopupAction
  | SetCredentialsAction
  | NativeOpenPopupAction
  | ClosePopupAction
  | SetTwitterInfoAction
  | SetTwitterErrorAction
  | SetInstagramInfoAction
  | SetInstagramErrorAction
  | SetTikTokInfoAction
  | SetTikTokErrorAction
  | ResetOAuthStateAction

export function twitterAuth() {
  return { type: REQUEST_TWITTER_AUTH }
}

export function instagramAuth() {
  return { type: REQUEST_INSTAGRAM_AUTH }
}

export function tikTokAuth() {
  return { type: REQUEST_TIKTOK_AUTH }
}

export const requestNativeOpenPopup = (
  resolve: (c: Credentials | PromiseLike<Credentials>) => void,
  reject: (e: Error) => void,
  url: string,
  provider: Provider
): RequestNativeOpenPopupAction => ({
  type: REQUEST_NATIVE_OPEN_POPUP,
  resolve,
  reject,
  url,
  provider
})

export const setCredentials = (
  credentials: Credentials
): SetCredentialsAction => ({
  type: SET_CREDENTIALS,
  credentials
})

export const nativeOpenPopup = (
  url: string,
  provider: Provider
): NativeOpenPopupAction => ({
  type: NATIVE_OPEN_POPUP,
  url,
  provider
})

export const closePopup = (abandoned: boolean): ClosePopupAction => ({
  type: CLOSE_POPUP,
  abandoned
})

export const setTwitterInfo = (
  uuid: string,
  profile: TwitterProfile,
  profileImage: Image,
  profileBanner: Image | undefined,
  requiresUserReview: boolean
): SetTwitterInfoAction => ({
  type: SET_TWITTER_INFO,
  uuid,
  profile,
  profileImage,
  profileBanner,
  requiresUserReview
})
export const setTwitterError = (error: any): SetTwitterErrorAction => ({
  type: SET_TWITTER_ERROR,
  error
})

export const setInstagramInfo = (
  uuid: string,
  profile: InstagramAccountPayload,
  profileImage: Image,
  requiresUserReview: boolean
): SetInstagramInfoAction => ({
  type: SET_INSTAGRAM_INFO,
  uuid,
  profile,
  profileImage,
  requiresUserReview
})
export const setInstagramError = (error: any): SetInstagramErrorAction => ({
  type: SET_INSTAGRAM_ERROR,
  error
})

export const setTikTokInfo = (
  uuid: string,
  profile: TikTokProfile,
  profileImage: Image | undefined,
  requiresUserReview: boolean
): SetTikTokInfoAction => ({
  type: SET_TIKTOK_INFO,
  uuid,
  profile,
  profileImage,
  requiresUserReview
})
export const setTikTokError = (error: any): SetTikTokErrorAction => ({
  type: SET_TIKTOK_ERROR,
  error
})

export const resetOAuthState = (): ResetOAuthStateAction => ({
  type: RESET_OAUTH_STATE
})
