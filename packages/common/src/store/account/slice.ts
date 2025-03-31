import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

import {
  AccountCollection,
  CachedAccount,
  PlaylistLibrary,
  User
} from '~/models'

import { ID } from '../../models/Identifiers'
import { Status } from '../../models/Status'

import {
  AccountState,
  FetchAccountFailedPayload,
  InstagramAccountPayload,
  RenameAccountPlaylistPayload,
  TikTokAccountPayload,
  TwitterAccountPayload
} from './types'

const initialState: AccountState = {
  collections: {},
  userId: null,
  hasTracks: null,
  status: Status.IDLE,
  reason: null,
  connectivityFailure: false, // Did we fail from no internet connectivity?
  needsAccountRecovery: false,
  walletAddresses: { currentUser: null, web3User: null },
  playlistLibrary: null,
  trackSaveCount: null,
  guestEmail: null
}

const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    fetchAccount: (
      _state,
      _action: PayloadAction<{ shouldMarkAccountAsLoading: boolean }>
    ) => {},
    fetchLocalAccount: () => {},
    fetchAccountRequested: (state) => {
      state.status = Status.LOADING
    },
    fetchAccountSucceeded: (state, action: PayloadAction<CachedAccount>) => {
      const { userId, collections, guestEmail } = action.payload
      state.userId = userId
      state.collections = keyBy(collections, 'id')
      state.playlistLibrary = action.payload.playlistLibrary ?? null
      state.trackSaveCount = action.payload.trackSaveCount ?? null
      state.status = Status.SUCCESS
      state.reason = null
      state.guestEmail = state.guestEmail ?? guestEmail
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
    signedIn: (_state, _action: PayloadAction<{ account: User }>) => {},
    setWalletAddresses: (
      state,
      action: PayloadAction<{
        currentUser: string | null
        web3User: string | null
      }>
    ) => {
      state.walletAddresses = action.payload
    },
    setGuestEmail: (
      state,
      action: PayloadAction<{
        guestEmail: string | null
      }>
    ) => {
      state.guestEmail = action.payload.guestEmail
    },
    updatePlaylistLibrary: (state, action: PayloadAction<PlaylistLibrary>) => {
      state.playlistLibrary = action.payload
    },
    incrementTrackSaveCount: (state) => {
      state.trackSaveCount = (state.trackSaveCount ?? 0) + 1
    },
    decrementTrackSaveCount: (state) => {
      state.trackSaveCount =
        state.trackSaveCount && state.trackSaveCount > 0
          ? state.trackSaveCount - 1
          : 0
    }
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
  setReachable,
  showPushNotificationConfirmation,
  setWalletAddresses,
  signedIn,
  subscribeBrowserPushNotifications,
  tikTokLogin,
  twitterLogin,
  unsubscribeBrowserPushNotifications,
  updatePlaylistLibrary,
  incrementTrackSaveCount,
  decrementTrackSaveCount
} = slice.actions

export const actions = slice.actions
export default slice.reducer
