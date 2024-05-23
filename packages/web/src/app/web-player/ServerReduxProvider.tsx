import { ReactElement } from 'react'

import { Kind } from '@audius/common/src/models/Kind'
import {
  cacheTracksReducer,
  cacheCollectionsReducer,
  cacheUsersReducer
} from '@audius/common/src/store/cache'
import { asCache } from '@audius/common/src/store/cache/reducer'
import { Provider } from 'react-redux'
import { combineReducers, createStore } from 'redux'
import { PartialDeep } from 'type-fest'

import { AppState } from 'store/types'

type ServerReduxProviderProps = {
  children: ReactElement
  initialState: PartialDeep<AppState>
}

const reducers = {
  users: asCache(cacheUsersReducer, Kind.TRACKS),
  tracks: asCache(cacheTracksReducer, Kind.TRACKS),
  collections: asCache(cacheCollectionsReducer, Kind.COLLECTIONS)
}

export const ServerReduxProvider = (props: ServerReduxProviderProps) => {
  const { initialState, children } = props
  return (
    <Provider
      store={createStore(combineReducers(reducers), initialState, undefined)}
    >
      {children}
    </Provider>
  )
}
