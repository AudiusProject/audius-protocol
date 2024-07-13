import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

import { User } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { ID } from '../../models/Identifiers'
import { Status } from '../../models/Status'

import {
  AccountCollection,
  InstagramAccountPayload,
  TikTokAccountPayload,
  TwitterAccountPayload
} from './types'
type FailureReason =
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_NOT_FOUND_LOCAL'
  | 'LIBS_ERROR'

const initialState = {
  collections: {} as { [id: number]: AccountCollection },
  // Used to track the ordering of playlists in the user's left nav
  // Array of strings that are either smart collection identifiers or user-generated collection ids
  orderedPlaylists: [] as string[],
  userId: null as number | null,
  hasTracks: null as boolean | null,
  status: Status.IDLE,
  reason: null as Nullable<FailureReason>,
  connectivityFailure: false, // Did we fail from no internet connectivity?
  needsAccountRecovery: false
}

type FetchAccountSucceededPayload = {
  userId: ID
  collections: AccountCollection[]
  orderedPlaylists: string[]
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
    fetchLocalAccount: () => {},
    fetchAccountRequested: (state) => {
      state.status = Status.LOADING
    },
    fetchAccountSucceeded: (
      state,
      action: PayloadAction<FetchAccountSucceededPayload>
    ) => {
      const { userId, orderedPlaylists, collections } = action.payload
      state.userId = userId
      state.orderedPlaylists = orderedPlaylists
      state.collections = keyBy(collections, 'id')
      state.status = Status.SUCCESS
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
    setNeedsAccountRecovery: (state) => {
      state.needsAccountRecovery = true
    },
    setPlaylistOrder: (state, action: PayloadAction<{ order: string[] }>) => {
      const { order } = action.payload
      state.orderedPlaylists = order
    },
    fetchHasTracks: () => {},
    setHasTracks: (state, action: PayloadAction<boolean>) => {
      state.hasTracks = action.payload
    },
    fetchBrowserPushNotifications: () => {},
    subscribeBrowserPushNotifications: () => {},
    unsubscribeBrowserPushNotifications: () => {},
    twitterLogin: (_state, _action: PayloadAction<TwitterAccountPayload>) => {},
    instagramLogin: (
      _state,
      _action: PayloadAction<InstagramAccountPayload>
    ) => {},
    tikTokLogin: (_state, _action: PayloadAction<TikTokAccountPayload>) => {},
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
  addAccountPlaylist,
  fetchAccount,
  fetchAccountFailed,
  fetchAccountNoInternet,
  fetchAccountRequested,
  fetchAccountSucceeded,
  fetchBrowserPushNotifications,
  fetchHasTracks,
  fetchLocalAccount,
  fetchSavedPlaylists,
  fetchSavedPlaylistsSucceeded,
  instagramLogin,
  removeAccountPlaylist,
  renameAccountPlaylist,
  resetAccount,
  setHasTracks,
  setNeedsAccountRecovery,
  setPlaylistOrder,
  setReachable,
  showPushNotificationConfirmation,
  signedIn,
  subscribeBrowserPushNotifications,
  tikTokLogin,
  twitterLogin,
  unsubscribeBrowserPushNotifications
} = slice.actions

export const actions = slice.actions
export default slice.reducer
