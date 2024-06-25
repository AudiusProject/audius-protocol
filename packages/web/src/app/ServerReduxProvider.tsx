import { ReactElement } from 'react'

import { Kind } from '@audius/common/src/models/Kind'
import {
  cacheTracksReducer,
  cacheCollectionsReducer,
  cacheUsersReducer
} from '@audius/common/src/store/cache'
import { asCache } from '@audius/common/src/store/cache/reducer'
import collectionPageReducer from '@audius/common/src/store/pages/collection/reducer'
import profilePageReducer from '@audius/common/src/store/pages/profile/reducer'
import trackPageReducer from '@audius/common/src/store/pages/track/reducer'
import { Provider } from 'react-redux'
import { combineReducers, createStore } from 'redux'
import { PartialDeep } from 'type-fest'

import { AppState } from 'store/types'

type ServerReduxProviderProps = {
  children: ReactElement
  initialState: PartialDeep<AppState>
}

const reducers = {
  // @ts-ignore
  users: asCache(cacheUsersReducer, Kind.USERS),
  // @ts-ignore
  tracks: asCache(cacheTracksReducer, Kind.TRACKS),
  // @ts-ignore
  collections: asCache(cacheCollectionsReducer, Kind.COLLECTIONS),
  pages: combineReducers({
    track: trackPageReducer,
    collection: collectionPageReducer,
    profile: profilePageReducer
  })
}

export const ServerReduxProvider = (props: ServerReduxProviderProps) => {
  const { initialState, children } = props
  return (
    <Provider
      // @ts-ignore
      store={createStore(combineReducers(reducers), initialState, undefined)}
    >
      {children}
    </Provider>
  )
}
