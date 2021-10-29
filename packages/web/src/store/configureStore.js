import * as Sentry from '@sentry/browser'
import {
  routerMiddleware,
  replace as replaceRoute
} from 'connected-react-router'
import { debounce, pick } from 'lodash'
import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'
import createSagaMiddleware from 'redux-saga'
import createSentryMiddleware from 'redux-sentry-middleware'

import { reducers as clientStoreReducers } from 'common/store'
import { postMessage } from 'services/native-mobile-interface/helpers'
import { MessageType } from 'services/native-mobile-interface/types'
import createRootReducer from 'store/reducers'
import rootSaga from 'store/sagas'
import { getIsDeployedOnHost } from 'utils/clientUtil'
import history from 'utils/history'
import { ERROR_PAGE } from 'utils/route'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const onSagaError = (error, extraInfo) => {
  console.error(`Caught saga error: ${error} ${extraInfo}`)
  store.dispatch(replaceRoute(ERROR_PAGE))

  // Get sagaStack if it exists, attaching
  // to sentry extra info + logging it
  let extra = extraInfo || {}
  if (error.sagaStack) {
    console.error(`Saga stack: ${error.sagaStack}`)
    extra = {
      ...extra,
      sagaStack: error.sagaStack
    }
  }

  // Send to sentry if not on localhost
  if (!getIsDeployedOnHost()) return
  try {
    Sentry.withScope(scope => {
      scope.setExtras(extra)
      Sentry.captureException(error)
    })
  } catch {
    // no-op
  }
}

// Can't send up the entire Redux state b/c it's too fat
// for Sentry to handle, and there is sensitive data
const statePruner = state => {
  return {
    account: {
      status: state.account.status,
      userId: state.account.userId
    },
    application: {
      pages: state.application.pages,
      ui: state.application.ui
    },
    profile: {
      handle: state.profile.handle,
      status: state.profile.status,
      updateError: state.profile.updateError,
      updateSuccess: state.profile.updateSuccess,
      updating: state.profile.updating,
      userId: state.profile.userId
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
const actionSanitizer = action => ({ type: action.type })
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

let store = null

// As long as the mobile client is dependent on the web client, we need to sync
// the client store from web -> mobile
const clientStoreKeys = Object.keys(clientStoreReducers)

const syncClientStateToNativeMobile = store => {
  if (NATIVE_MOBILE) {
    let currentState
    const postMessageDebounced = debounce(postMessage, 500, { leading: true })

    store.subscribe(() => {
      const state = store.getState()
      const previousState = currentState
      currentState = state
      if (
        !previousState ||
        clientStoreKeys.some(k => currentState[k] !== previousState[k])
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

export default function configureStore() {
  const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
  store = createStore(createRootReducer(history), composeEnhancers(middlewares))
  syncClientStateToNativeMobile(store)
  sagaMiddleware.run(rootSaga)
  return store
}
