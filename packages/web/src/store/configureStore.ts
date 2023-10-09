import { chatMiddleware, ErrorLevel, Name } from '@audius/common'
import { composeWithDevToolsLogOnlyInProduction } from '@redux-devtools/extension'
import * as Sentry from '@sentry/browser'
import { routerMiddleware } from 'connected-react-router'
import { createStore, applyMiddleware, Action, Store } from 'redux'
import createSagaMiddleware from 'redux-saga'
import createSentryMiddleware from 'redux-sentry-middleware'
import thunk from 'redux-thunk'

import { track as amplitudeTrack } from 'services/analytics/amplitude'
import { audiusSdk } from 'services/audius-sdk'
import * as errorActions from 'store/errors/actions'
import { reportToSentry } from 'store/errors/reportToSentry'
import createRootReducer from 'store/reducers'
import rootSaga from 'store/sagas'
import history from 'utils/history'
import logger from 'utils/logger'

import { storeContext } from './storeContext'
import { AppState } from './types'

declare global {
  interface Window {
    store: Store<RootState>
  }
}

type RootState = ReturnType<typeof store.getState>

const onSagaError = (
  error: Error,
  errorInfo: {
    sagaStack: string
  }
) => {
  console.error(
    `Caught saga error: ${error} ${JSON.stringify(errorInfo, null, 4)}`
  )
  store.dispatch(
    errorActions.handleError({
      name: 'Caught Saga Error',
      message: error.message,
      shouldRedirect: true
    })
  )
  const additionalInfo = {
    ...errorInfo,
    route: window.location.pathname
  }

  reportToSentry({
    level: ErrorLevel.Fatal,
    error,
    additionalInfo
  })
  amplitudeTrack(Name.ERROR_PAGE, additionalInfo)
}

// Can't send up the entire Redux state b/c it's too fat
// for Sentry to handle, and there is sensitive data
const statePruner = (state: AppState) => {
  const currentProfileHandle = state.pages.profile.currentUser ?? ''
  const currentProfile = state.pages.profile.entries[currentProfileHandle] ?? {}

  return {
    account: {
      status: state.account.status,
      userId: state.account.userId,
      reason: state.account.reason
    },
    pages: {
      profile: {
        handle: currentProfile.handle,
        status: currentProfile.status,
        updateError: currentProfile.updateError,
        updateSuccess: currentProfile.updateSuccess,
        updating: currentProfile.updating,
        userId: currentProfile.userId
      }
    },
    router: {
      action: state.router.action,
      location: state.router.location
    },
    signOn: {
      accountReady: state.signOn.accountReady,
      email: state.signOn.email,
      handle: state.signOn.handle,
      status: state.signOn.status,
      twitterId: state.signOn.twitterId,
      twitteRScreenName: state.signOn.twitterScreenName,
      useMetaMask: state.signOn.useMetaMask,
      verified: state.signOn.verified
    },
    upload: {
      completionId: state.upload.completionId,
      failedTrackIndices: state.upload.failedTrackIndices,
      metadata: state.upload.metadata,
      success: state.upload.success,
      tracks: (state.upload.tracks || []).map((t) => ({
        metadata: t.metadata
      })),
      uploading: state.upload.uploading,
      uploadProgress: state.upload.uploadProgress,
      uploadType: state.upload.uploadType
    }
  }
}

// We're not logging any action bodies to prevent us from accidentally
// logging sensitive information in the future if additional actions are added.
// If we discover we want specific action bodies in the future for Sentry
// debuggability, those should be whitelisted here.
const actionSanitizer = (action: Action) => ({ type: action.type })
const sentryMiddleware = createSentryMiddleware(Sentry as any, {
  actionTransformer: actionSanitizer,
  stateTransformer: statePruner
})

const sagaMiddleware = createSagaMiddleware({
  onError: onSagaError,
  context: storeContext
})

const middlewares = applyMiddleware(
  chatMiddleware(audiusSdk),
  routerMiddleware(history),
  sagaMiddleware,
  sentryMiddleware,
  thunk
)

const configureStore = () => {
  const composeEnhancers = composeWithDevToolsLogOnlyInProduction({
    trace: true,
    traceLimit: 25,
    maxAge: 1000
  })
  const store = createStore(
    createRootReducer(history),
    composeEnhancers(middlewares)
  )
  sagaMiddleware.run(rootSaga)
  return store
}

export const store = configureStore()

// Mount store to window for easy access
window.store = store

// Set up logger on store
logger(store)
