import { FollowArtistsCategory } from './types'

export const SIGN_IN_FAILED = 'SIGN_ON/SIGN_IN_FAILED'
export const SIGN_IN_FAILED_RESET = 'SIGN_ON/SIGN_IN_FAILED_RESET'
export const SET_EMAIL_STATUS = 'SIGN_ON/SET_EMAIL_STATUS'
export const VALIDATE_EMAIL = 'SIGN_ON/VALIDATE_EMAIL'
export const VALIDATE_EMAIL_SUCEEDED = 'SIGN_ON/VALIDATE_EMAIL_SUCCEEDED'
export const VALIDATE_EMAIL_FAILED = 'SIGN_ON/VALIDATE_EMAIL_FAILED'
export const SET_HANDLE_STATUS = 'SIGN_ON/SET_HANDLE_STATUS'
export const VALIDATE_HANDLE_FAILED = 'SIGN_ON/VALIDATE_HANDLE_FAILED'
export const VALIDATE_HANDLE_SUCEEDED = 'SIGN_ON/VALIDATE_HANDLE_SUCCEEDED'
export const FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED =
  'SIGN_ON/FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED'
export const FETCH_ALL_FOLLOW_ARTISTS_FAILED =
  'SIGN_ON/FETCH_ALL_FOLLOW_ARTISTS_FAILED'
export const SET_FOLLOW_ARTISTS_CATEGORY = 'SIGN_ON/SET_FOLLOW_ARTISTS_CATEGORY'
export const SET_FOLLOWED_ARTISTS = 'SIGN_ON/SET_FOLLOWED_ARTISTS'
export const SET_USERS_TO_FOLLOW = 'SIGN_ON/SET_USERS_TO_FOLLOW'
export const SET_ACCOUNT_AVAILABLE = 'SIGN_ON/SET_ACCOUNT_AVAILABLE'
export const SIGN_UP_SUCCEEDED = 'SIGN_ON/SIGN_UP_SUCCEEDED'
export const RESET_SIGNON_STATE = 'SIGN_ON/RESET_SIGNON_STATE'

type SignupFieldStatusType = 'editing' | 'done'
export type SignupHandleStatusType = SignupFieldStatusType
export type SignupEmailStatusType = SignupFieldStatusType

type SigninFailedAction = {
  type: typeof SIGN_IN_FAILED
  error: string
}

type SigninFailedResetAction = {
  type: typeof SIGN_IN_FAILED_RESET
}

type SignupSetEmailStatusAction = {
  type: typeof SET_EMAIL_STATUS
  status: SignupEmailStatusType
}

type SignupValidateEmailFailedAction = {
  type: typeof VALIDATE_EMAIL_FAILED
  error: any
}

type SignupValidateEmailSuceededAction = {
  type: typeof VALIDATE_EMAIL_SUCEEDED
  available: boolean
}

type SignupSetHandleStatusAction = {
  type: typeof SET_HANDLE_STATUS
  status: SignupHandleStatusType
}

type SignupValidateHandleFailedAction = {
  type: typeof VALIDATE_HANDLE_FAILED
  error: any
}

type SignupValidateHandleSuceededAction = {
  type: typeof VALIDATE_HANDLE_SUCEEDED
}

type FetchAllFollowArtistsSucceededAction = {
  type: typeof FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED
  category: FollowArtistsCategory
  userIds: number[]
}
type FetchAllFollowArtistsFailedAction = {
  type: typeof FETCH_ALL_FOLLOW_ARTISTS_FAILED
  error: any
}

type SetFollowArtistsCategoryAction = {
  type: typeof SET_FOLLOW_ARTISTS_CATEGORY
  category: FollowArtistsCategory
}

type SetFollowedArtistsAction = {
  type: typeof SET_FOLLOWED_ARTISTS
  userIds: number[]
}

type SetUsersToFollowAction = {
  type: typeof SET_USERS_TO_FOLLOW
  users: any[]
}

type SetAccountAvailableAction = {
  type: typeof SET_ACCOUNT_AVAILABLE
  isAvailable: boolean
  finalEmail: string
  finalHandle: string
}

type SignupSuceededAction = {
  type: typeof SIGN_UP_SUCCEEDED
  userId: number | null
}

type ResetSignonStateAction = {
  type: typeof RESET_SIGNON_STATE
}

export type SignonActions =
  | SigninFailedAction
  | SigninFailedResetAction
  | SignupSetEmailStatusAction
  | SignupValidateEmailFailedAction
  | SignupValidateEmailSuceededAction
  | SignupSetHandleStatusAction
  | SignupValidateHandleFailedAction
  | SignupValidateHandleSuceededAction
  | FetchAllFollowArtistsSucceededAction
  | FetchAllFollowArtistsFailedAction
  | SetFollowArtistsCategoryAction
  | SetFollowedArtistsAction
  | SignupSuceededAction
  | SetUsersToFollowAction
  | SetAccountAvailableAction
  | ResetSignonStateAction

export const signinFailed = (error: string): SigninFailedAction => ({
  type: SIGN_IN_FAILED,
  error
})

export const signinFailedReset = (): SigninFailedResetAction => ({
  type: SIGN_IN_FAILED_RESET
})

export const setEmailStatus = (
  status: SignupEmailStatusType
): SignupSetEmailStatusAction => ({
  type: SET_EMAIL_STATUS,
  status
})
export const signupValidateEmailFailed = (
  error: string
): SignupValidateEmailFailedAction => ({
  type: VALIDATE_EMAIL_FAILED,
  error
})
export const signupValidateEmailSuceeded = (
  available: boolean
): SignupValidateEmailSuceededAction => ({
  type: VALIDATE_EMAIL_SUCEEDED,
  available
})
export const setHandleStatus = (
  status: SignupHandleStatusType
): SignupSetHandleStatusAction => ({
  type: SET_HANDLE_STATUS,
  status
})
export const signupValidateHandleFailed = (
  error: string
): SignupValidateHandleFailedAction => ({
  type: VALIDATE_HANDLE_FAILED,
  error
})
export const signupValidateHandleSuceeded = (): SignupValidateHandleSuceededAction => ({
  type: VALIDATE_HANDLE_SUCEEDED
})
export const fetchAllFollowArtistsSucceeded = (
  category: FollowArtistsCategory,
  userIds: number[]
): FetchAllFollowArtistsSucceededAction => ({
  type: FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED,
  category,
  userIds
})
export const fetchAllFollowArtistsFailed = (
  error: any
): FetchAllFollowArtistsFailedAction => ({
  type: FETCH_ALL_FOLLOW_ARTISTS_FAILED,
  error
})
export const setFollowArtistsCategory = (
  category: FollowArtistsCategory
): SetFollowArtistsCategoryAction => ({
  type: SET_FOLLOW_ARTISTS_CATEGORY,
  category
})
export const setFollowedArtists = (
  userIds: number[]
): SetFollowedArtistsAction => ({
  type: SET_FOLLOWED_ARTISTS,
  userIds
})
export const setUsersToFollow = (users: any[]): SetUsersToFollowAction => ({
  type: SET_USERS_TO_FOLLOW,
  users
})
export const setAccountAvailable = (
  isAvailable: boolean,
  finalEmail: string,
  finalHandle: string
): SetAccountAvailableAction => ({
  type: SET_ACCOUNT_AVAILABLE,
  isAvailable,
  finalEmail,
  finalHandle
})
export const signupSuceeded = (userId: number): SignupSuceededAction => ({
  type: SIGN_UP_SUCCEEDED,
  userId
})
export const resetSignonState = (): ResetSignonStateAction => ({
  type: RESET_SIGNON_STATE
})
