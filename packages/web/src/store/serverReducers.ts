import { SsrPageProps } from '@audius/common/models'
import { serverReducers } from '@audius/common/serverStore'
import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import localForage from 'localforage'
import { combineReducers } from 'redux'

import error from 'store/errors/reducers'

const createRootReducer = (
  routeHistory: History,
  ssrPageProps?: SsrPageProps,
  isServerSide?: boolean
) => {
  const commonStoreReducers = serverReducers(
    localForage,
    ssrPageProps,
    isServerSide,
    routeHistory
  )

  return combineReducers({
    // Common store
    ...commonStoreReducers,
    // (End common store)

    // Router
    router: connectRouter(routeHistory),

    // Error Page
    error: error(ssrPageProps)
  })
}

export default createRootReducer
