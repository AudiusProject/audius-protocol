export const BACKEND_LOADED = 'LIFECYCLE/BACKEND_LOADED'
export const BACKEND_TEAR_DOWN = 'LIFECYCLE/BACKEND_TEAR_DOWN'
export const ON_FIRST_PAGE = 'LIFECYCLE/ON_FIRST_PAGE'
export const NOT_ON_FIRST_PAGE = 'LIFECYCLE/NOT_ON_FIRST_PAGE'
export const SIGNED_IN = 'LIFECYCLE/SIGNED_IN'

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

type SignedInAction = {
  type: typeof SIGNED_IN
}

export type LifecycleActions = BackendLoadedAction 
  | BackendTearDownAction 
  | OnFirstPageAction
  | NotOnFirstPageAction
  | SignedInAction

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

export const signedIn = (): SignedInAction => ({
  type: SIGNED_IN
})
