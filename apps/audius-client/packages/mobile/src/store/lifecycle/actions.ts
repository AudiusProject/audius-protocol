import type { User } from '@audius/common'

export const SIGNED_IN = 'LIFECYCLE/SIGNED_IN'
export const SIGNED_OUT = 'LIFECYCLE/SIGNED_OUT'
export const ON_SIGN_UP = 'LIFECYCLE/ON_SIGN_UP'
export const FETCH_ACCOUNT_FAILED = 'SIGN_ON/FETCH_ACCOUNT_FAILED'
export const ENTER_FOREGROUND = 'LIFECYCLE/ENTER_FOREGROUND'
export const ENTER_BACKGROUND = 'LIFECYCLE/ENTER_BACKGROUND'

type SignedInAction = {
  type: typeof SIGNED_IN
  account: User
}

type SignedOutAction = {
  type: typeof SIGNED_OUT
  account: User
}

type OnSignUpAction = {
  type: typeof ON_SIGN_UP
  onSignUp: boolean
}

type FetchAccountFailedAction = {
  type: typeof FETCH_ACCOUNT_FAILED
}

type EnterForegroundAction = {
  type: typeof ENTER_FOREGROUND
}

type EnterBackgroundAction = {
  type: typeof ENTER_BACKGROUND
}

export type LifecycleActions =
  | SignedInAction
  | SignedOutAction
  | OnSignUpAction
  | FetchAccountFailedAction
  | EnterForegroundAction
  | EnterBackgroundAction

export const signedIn = (account: User): SignedInAction => ({
  type: SIGNED_IN,
  account
})

export const signedOut = (account: User): SignedOutAction => ({
  type: SIGNED_OUT,
  account
})

export const onSignUp = (onSignUp: boolean): OnSignUpAction => ({
  type: ON_SIGN_UP,
  onSignUp
})

export const fetchAccountFailed = (): FetchAccountFailedAction => ({
  type: FETCH_ACCOUNT_FAILED
})

export const enterForeground = (): EnterForegroundAction => ({
  type: ENTER_FOREGROUND
})

export const enterBackground = (): EnterBackgroundAction => ({
  type: ENTER_BACKGROUND
})
