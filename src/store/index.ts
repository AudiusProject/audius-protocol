import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client'
import {
  combineReducers,
  createStore as createReduxStore,
  applyMiddleware
} from 'redux'
import { connectRouter } from 'connected-react-router'
import { composeWithDevTools } from 'redux-devtools-extension'
import { routerMiddleware } from 'connected-react-router'
import { History } from 'history'
import Audius from '../services/Audius'
import thunk from 'redux-thunk'
import discoveryProvider from './cache/discoveryProvider/slice'
import contentNode from './cache/contentNode/slice'
import protocol from './cache/protocol/slice'
import user from './cache/user/slice'
import proposals from './cache/proposals/slice'
import votes from './cache/votes/slice'
import rewards from './cache/rewards/slice'
import timeline from './cache/timeline/slice'
import claims from './cache/claims/slice'
import analytics from './cache/analytics/slice'
import music from './cache/music/slice'
import account from './account/slice'
import pageHistory from './pageHistory/slice'
import api from './api/slice'

declare global {
  interface Window {
    aud: any
    store: any
    client: ApolloClient<any>
    hostedClient: ApolloClient<any>
  }
}

const gqlUri = import.meta.env.VITE_GQL_URI
const gqlBackupUri = import.meta.env.VITE_GQL_BACKUP_URI

export const client = new ApolloClient({
  uri: gqlUri,
  cache: new InMemoryCache()
})

let hostedClient: ApolloClient<NormalizedCacheObject> | null = null
export const getBackupClient = () => {
  if (hostedClient) {
    return hostedClient
  } else if (gqlBackupUri) {
    hostedClient = new ApolloClient({
      uri: gqlBackupUri,
      cache: new InMemoryCache()
    })

    window.hostedClient = hostedClient
    return hostedClient
  }
  return null
}

export const hasBackupClient = !!gqlBackupUri

const aud = new Audius()
window.aud = aud
aud.setup()

window.client = client

const getReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    pageHistory,
    account,
    api,
    cache: combineReducers({
      discoveryProvider,
      contentNode,
      protocol,
      user,
      proposals,
      votes,
      timeline,
      claims,
      analytics,
      music,
      rewards
    })
  })
}

const getMiddlewares = (history: History) =>
  applyMiddleware(routerMiddleware(history), thunk.withExtraArgument(aud))

export const createStore = (history: History) => {
  const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
  const storeReducer = getReducer(history)
  const middlewares = getMiddlewares(history)
  let store = createReduxStore(storeReducer, composeEnhancers(middlewares))
  window.store = store
  return store
}

export default createStore
