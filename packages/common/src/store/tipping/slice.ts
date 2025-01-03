import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TipSource } from '../../models/Analytics'
import { ID } from '../../models/Identifiers'
import { UserTip } from '../../models/Tipping'
import { User } from '../../models/User'
import type { Nullable } from '../../utils/typeUtils'

import {
  RefreshSupportPayloadAction,
  SupportersMapForUser,
  SupportingMapForUser,
  TippingState
} from './types'

const initialState: TippingState = {
  supporters: {},
  supportersOverrides: {},
  supporting: {},
  supportingOverrides: {},
  send: {
    status: null,
    user: null,
    amount: '0',
    error: null,
    source: 'profile',
    trackId: null
  },
  tipToDisplay: null,
  showTip: false
}

const slice = createSlice({
  name: 'tipping',
  initialState,
  reducers: {
    setSupportersForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportersForUser: SupportersMapForUser
      }>
    ) => {
      const { id, supportersForUser } = action.payload
      state.supporters[id] = {
        ...state.supporters[id],
        ...supportersForUser
      }
    },
    setSupportersOverridesForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportersOverridesForUser: SupportersMapForUser
      }>
    ) => {
      const { id, supportersOverridesForUser } = action.payload
      state.supportersOverrides[id] = {
        ...state.supportersOverrides[id],
        ...supportersOverridesForUser
      }
    },
    setSupportingForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportingForUser: SupportingMapForUser
      }>
    ) => {
      const { id, supportingForUser } = action.payload
      state.supporting[id] = {
        ...state.supporting[id],
        ...supportingForUser
      }
    },
    setSupportingOverridesForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportingOverridesForUser: SupportingMapForUser
      }>
    ) => {
      const { id, supportingOverridesForUser } = action.payload
      state.supportingOverrides[id] = {
        ...state.supportingOverrides[id],
        ...supportingOverridesForUser
      }
    },
    refreshSupport: (
      _state,
      _action: PayloadAction<RefreshSupportPayloadAction>
    ) => {},
    fetchSupportingForUser: (
      _state,
      _action: PayloadAction<{ userId: ID }>
    ) => {},
    beginTip: (
      state,
      action: PayloadAction<{
        user: User | null
        source: TipSource
        trackId?: ID
        onSuccessActions?: Action[]
        onSuccessConfirmedActions?: Action[]
      }>
    ) => {
      if (!action.payload.user) {
        return
      }
      state.send.status = 'SEND'
      state.send.source = action.payload.source
      state.send.user = action.payload.user
      state.send.trackId = action.payload.trackId ?? null
      state.send.onSuccessActions = action.payload.onSuccessActions
      state.send.onSuccessConfirmedActions =
        action.payload.onSuccessConfirmedActions
    },
    sendTip: (state, action: PayloadAction<{ amount: string }>) => {
      if (state.send.status !== 'SEND') {
        return
      }
      state.send.status = 'CONFIRM'
      state.send.amount = action.payload.amount
    },
    confirmSendTip: (state) => {
      if (state.send.status !== 'CONFIRM' && state.send.status !== 'ERROR') {
        return
      }
      state.send.status = 'SENDING'
    },
    convert: (state) => {
      if (state.send.status !== 'SENDING') {
        return
      }
      state.send.status = 'CONVERTING'
    },
    sendTipSucceeded: (state) => {
      state.send.status = 'SUCCESS'
    },
    sendTipFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.send.status = 'ERROR'
      state.send.error = action.payload.error
    },
    resetSend: (state) => {
      state.send.status = null
      state.send.user = null
      state.send.amount = '0'
      state.send.error = null
      state.send.trackId = null
    },
    fetchRecentTips: (_state) => {},
    fetchUserSupporter: (
      _state,
      _action: PayloadAction<{
        currentUserId: ID
        userId: ID
        supporterUserId: ID
      }>
    ) => {},
    setTipToDisplay: (
      state,
      action: PayloadAction<{ tipToDisplay: UserTip }>
    ) => {
      state.tipToDisplay = action.payload.tipToDisplay
    },
    setShowTip: (state, action: PayloadAction<{ show: boolean }>) => {
      state.showTip = action.payload.show
    },
    refreshTipGatedTracks: (
      _state,
      _action: PayloadAction<{ userId: ID; trackId?: Nullable<ID> }>
    ) => {
      // triggers saga
    }
  }
})

export const {
  confirmSendTip,
  convert,
  fetchRecentTips,
  fetchSupportingForUser,
  refreshSupport,
  sendTipFailed,
  sendTipSucceeded,
  setTipToDisplay,
  setSupportingForUser,
  setSupportersForUser,
  setShowTip,
  setSupportingOverridesForUser,
  setSupportersOverridesForUser,
  fetchUserSupporter,
  refreshTipGatedTracks
} = slice.actions

export const actions = slice.actions

export default slice.reducer
