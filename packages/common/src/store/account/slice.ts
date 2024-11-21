import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

import { AccountCollection, User } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { ID } from '../../models/Identifiers'
import { Status } from '../../models/Status'

import {
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
  userId: null as number | null,
  hasTracks: null as boolean | null,
  status: Status.IDLE,
  reason: null as Nullable<FailureReason>,
  connectivityFailure: false, // Did we fail from no internet connectivity?
  needsAccountRecovery: false,
  walletAddresses: { currentUser: null, web3User: null } as {
    currentUser: string | null
    web3User: string | null
  }
}

type FetchAccountSucceededPayload = {
  userId: ID
  collections: AccountCollection[]
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
      const { userId, collections } = action.payload
      state.userId = userId
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
    ) => {},
    setWalletAddresses: (
      state,
      action: PayloadAction<{
        currentUser: string | null
        web3User: string | null
      }>
    ) => {
      state.walletAddresses = action.payload
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
  unsubscribeBrowserPushNotifications
} = slice.actions

export const actions = slice.actions
export default slice.reducer
