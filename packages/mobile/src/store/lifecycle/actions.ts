import User from 'models/User'

export const BACKEND_LOADED = 'LIFECYCLE/BACKEND_LOADED'
export const BACKEND_TEAR_DOWN = 'LIFECYCLE/BACKEND_TEAR_DOWN'
export const ON_FIRST_PAGE = 'LIFECYCLE/ON_FIRST_PAGE'
export const NOT_ON_FIRST_PAGE = 'LIFECYCLE/NOT_ON_FIRST_PAGE'
export const CHANGED_PAGE = 'LIFECYCLE/CHANGED_PAGE'
export const SIGNED_IN = 'LIFECYCLE/SIGNED_IN'
export const SIGNED_OUT = 'LIFECYCLE/SIGNED_OUT'
export const ON_SIGN_UP = 'LIFECYCLE/ON_SIGN_UP'
export const FETCH_ACCOUNT_FAILED = 'SIGN_ON/FETCH_ACCOUNT_FAILED'

type BackendLoadedAction = {
  type: typeof BACKEND_LOADED
}

type BackendTearDownAction = {
  type: typeof BACKEND_TEAR_DOWN
}

type OnFirstPageAction = {
  type: typeof ON_FIRST_PAGE
}
type NotOnFirstPageAction = {
  type: typeof NOT_ON_FIRST_PAGE
}
type ChangedPageAction = {
  type: typeof CHANGED_PAGE
  location: any
}

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

export type LifecycleActions =
  | BackendLoadedAction
  | BackendTearDownAction
  | OnFirstPageAction
  | NotOnFirstPageAction
  | ChangedPageAction
  | SignedInAction
  | SignedOutAction
  | OnSignUpAction
  | FetchAccountFailedAction

export const backendLoaded = (): BackendLoadedAction => ({
  type: BACKEND_LOADED
})

export const backendTearDown = (): BackendTearDownAction => ({
  type: BACKEND_TEAR_DOWN
})

export const onFirstPage = (): OnFirstPageAction => ({
  type: ON_FIRST_PAGE
})

export const notOnFirstPage = (): NotOnFirstPageAction => ({
  type: NOT_ON_FIRST_PAGE
})

export const changedPage = (location: any): ChangedPageAction => ({
  type: CHANGED_PAGE,
  location
})

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
