import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

import { User } from 'models'
import { Nullable } from 'utils/typeUtils'

import { ID } from '../../models/Identifiers'
import { Status } from '../../models/Status'

import {
  AccountCollection,
  InstagramAccountPayload,
  TwitterAccountPayload
} from './types'
type FailureReason = 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_NOT_FOUND' | 'LIBS_ERROR'

const initialState = {
  collections: {} as { [id: number]: AccountCollection },
  // Used to track the ordering of playlists in the user's left nav
  // Array of strings that are either smart collection identifiers or user-generated collection ids
  orderedPlaylists: [] as string[],
  userId: null as number | null,
  status: Status.LOADING,
  reason: null as Nullable<FailureReason>,
  hasFavoritedItem: false,
  connectivityFailure: false, // Did we fail from no internet connectivity?
  needsAccountRecovery: false
}

type FetchAccountSucceededPayload = {
  userId: ID
  collections: AccountCollection[]
  orderedPlaylists: string[]
  hasFavoritedItem: boolean
}

type FetchAccountFailedPayload = {
  reason: FailureReason
}

type RenameAccountPlaylistPayload = {
  collectionId: ID
  name: string
}

const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    fetchAccount: () => {},
    fetchAccountRequested: (state) => {
      state.status = Status.LOADING
    },
    fetchAccountSucceeded: (
      state,
      action: PayloadAction<FetchAccountSucceededPayload>
    ) => {
      const { userId, orderedPlaylists, collections, hasFavoritedItem } =
        action.payload
      state.userId = userId
      state.orderedPlaylists = orderedPlaylists
      state.collections = keyBy(collections, 'id')
      state.status = Status.SUCCESS
      state.hasFavoritedItem = hasFavoritedItem
      state.reason = null
    },
    fetchAccountFailed: (
      state,
      action: PayloadAction<FetchAccountFailedPayload>
    ) => {
      state.status = Status.ERROR
      state.reason = action.payload.reason
    },
    fetchAccountNoInternet: (state) => {
      state.connectivityFailure = true
    },
    setReachable: (state) => {
      state.connectivityFailure = false
    },
    addAccountPlaylist: (state, action: PayloadAction<AccountCollection>) => {
      state.collections[action.payload.id] = action.payload
    },
    removeAccountPlaylist: (
      state,
      action: PayloadAction<{ collectionId: ID }>
    ) => {
      const { collectionId } = action.payload
      delete state.collections[collectionId]
    },
    renameAccountPlaylist: (
      state,
      action: PayloadAction<RenameAccountPlaylistPayload>
    ) => {
      const { collectionId, name } = action.payload
      state.collections[collectionId].name = name
    },
    fetchSavedAlbums: () => {},
    fetchSavedAlbumsSucceeded: (
      state,
      action: PayloadAction<{ collections: AccountCollection[] }>
    ) => {
      const { collections } = action.payload

      state.collections = {
        ...state.collections,
        ...keyBy(collections, 'id')
      }
    },
    fetchSavedPlaylists: () => {},
    fetchSavedPlaylistsSucceeded: (
      state,
      action: PayloadAction<{ collections: AccountCollection[] }>
    ) => {
      const { collections } = action.payload

      state.collections = {
        ...state.collections,
        ...keyBy(collections, 'id')
      }
    },
    didFavoriteItem: (state) => {
      state.hasFavoritedItem = true
    },
    setNeedsAccountRecovery: (state) => {
      state.needsAccountRecovery = true
    },
    setPlaylistOrder: (state, action: PayloadAction<{ order: string[] }>) => {
      const { order } = action.payload
      state.orderedPlaylists = order
    },
    fetchBrowserPushNotifications: () => {},
    subscribeBrowserPushNotifications: () => {},
    unsubscribeBrowserPushNotifications: () => {},
    twitterLogin: (_state, _action: PayloadAction<TwitterAccountPayload>) => {},
    instagramLogin: (
      _state,
      _action: PayloadAction<InstagramAccountPayload>
    ) => {},
    showPushNotificationConfirmation: () => {},
    resetAccount: () => {
      return initialState
    },
    signedIn: (
      _state,
      _action: PayloadAction<{ account: User; isSignUp: boolean }>
    ) => {}
  }
})

export const {
  fetchAccount,
  fetchAccountRequested,
  fetchAccountSucceeded,
  fetchAccountFailed,
  fetchAccountNoInternet,
  setReachable,
  addAccountPlaylist,
  removeAccountPlaylist,
  renameAccountPlaylist,
  fetchSavedAlbums,
  fetchSavedAlbumsSucceeded,
  fetchSavedPlaylists,
  fetchSavedPlaylistsSucceeded,
  didFavoriteItem,
  setNeedsAccountRecovery,
  setPlaylistOrder,
  fetchBrowserPushNotifications,
  subscribeBrowserPushNotifications,
  unsubscribeBrowserPushNotifications,
  instagramLogin,
  twitterLogin,
  showPushNotificationConfirmation,
  resetAccount,
  signedIn
} = slice.actions

export const reducer = slice.reducer
export const actions = slice.actions

export default slice
