import * as Sentry from '@sentry/browser'
import { routerMiddleware, push as pushRoute } from 'connected-react-router'
import { debounce, pick } from 'lodash'
import { createStore, applyMiddleware, Action, Store } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'
import createSagaMiddleware from 'redux-saga'
import createSentryMiddleware from 'redux-sentry-middleware'

import { reducers as clientStoreReducers } from 'common/store'
import { Level } from 'common/store/errors/level'
import { reportToSentry } from 'common/store/errors/reportToSentry'
import { postMessage } from 'services/native-mobile-interface/helpers'
import { MessageType } from 'services/native-mobile-interface/types'
import { track as amplitudeTrack } from 'store/analytics/providers/amplitude'
import createRootReducer from 'store/reducers'
import rootSaga from 'store/sagas'
import history from 'utils/history'
import logger from 'utils/logger'
import { ERROR_PAGE } from 'utils/route'

import { AppState } from './types'

declare global {
  interface Window {
    store: Store<RootState>
  }
}

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type RootState = ReturnType<typeof store.getState>

const onSagaError = (
  error: Error,
  errorInfo: {
    sagaStack: string
  }
) => {
  console.error(`Caught saga error: ${error} ${errorInfo}`)
  store.dispatch(pushRoute(ERROR_PAGE))

  reportToSentry({
    level: Level.Fatal,
    error,
    additionalInfo: errorInfo
  })
  amplitudeTrack(ERROR_PAGE, errorInfo)
}

// Can't send up the entire Redux state b/c it's too fat
// for Sentry to handle, and there is sensitive data
const statePruner = (state: AppState) => {
  return {
    account: {
      status: state.account.status,
      userId: state.account.userId
    },
    application: {
      pages: {
        profile: {
          handle: state.application.pages.profile.handle,
          status: state.application.pages.profile.status,
          updateError: state.application.pages.profile.updateError,
          updateSuccess: state.application.pages.profile.updateSuccess,
          updating: state.application.pages.profile.updating,
          userId: state.application.pages.profile.userId
        }
      },
      ui: state.application.ui
    },
    router: {
      action: state.router.action,
      location: state.router.location
    },
    serviceSelection: {
      primary: state.serviceSelection.primary,
      secondaries: state.serviceSelection.secondaries,
      services: state.serviceSelection.services,
      status: state.serviceSelection.status
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
      tracks: (state.upload.tracks || []).map(t => ({ metadata: t.metadata })),
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
const sentryMiddleware = createSentryMiddleware(Sentry, {
  actionTransformer: actionSanitizer,
  stateTransformer: statePruner
})

const sagaMiddleware = createSagaMiddleware({ onError: onSagaError })

const middlewares = applyMiddleware(
  routerMiddleware(history),
  sagaMiddleware,
  sentryMiddleware
)

// As long as the mobile client is dependent on the web client, we need to sync
// the client store from web -> mobile
const clientStoreKeys = Object.keys(clientStoreReducers)

const syncClientStateToNativeMobile = (store: Store) => {
  if (NATIVE_MOBILE) {
    let currentState: RootState
    const postMessageDebounced = debounce(postMessage, 500, { leading: true })

    store.subscribe(() => {
      const state: RootState = store.getState()
      const previousState = currentState
      currentState = state
      if (
        !previousState ||
        clientStoreKeys.some(
          k =>
            currentState[k as keyof RootState] !==
            previousState[k as keyof RootState]
        )
      ) {
        // Debounce messages to minimize expensive stringify and parse.
        // Leading and trailing states are sent, state will be out of sync
        // a maximum of 500ms
        postMessageDebounced({
          type: MessageType.SYNC_CLIENT_STORE,
          state: pick(state, clientStoreKeys)
        })
      }
    })
  }
}

const configureStore = () => {
  const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
  const store = createStore(
    createRootReducer(history),
    composeEnhancers(middlewares)
  )
  syncClientStateToNativeMobile(store)
  sagaMiddleware.run(rootSaga)
  return store
}

export const store = configureStore()

// Mount store to window for easy access
window.store = store

// Set up logger on store
logger(store)
