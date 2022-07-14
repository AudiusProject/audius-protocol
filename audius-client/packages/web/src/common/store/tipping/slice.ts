import { ID } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RecentTipsStorage, UserTip } from 'common/models/Tipping'
import { User } from 'common/models/User'
import {
  SupportersMapForUser,
  SupportingMapForUser,
  TippingState
} from 'common/store/tipping/types'
import { Nullable } from 'common/utils/typeUtils'

export type RefreshSupportPayloadAction = {
  senderUserId: ID
  receiverUserId: ID
  supportingLimit?: number
  supportersLimit?: number
}

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
    source: 'profile'
  },
  recentTips: [],
  storage: null,
  tipToDisplay: null,
  showTip: true
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
      state,
      action: PayloadAction<RefreshSupportPayloadAction>
    ) => {},
    fetchSupportingForUser: (
      state,
      action: PayloadAction<{ userId: ID }>
    ) => {},
    beginTip: (
      state,
      action: PayloadAction<{ user: User | null; source: 'profile' | 'feed' }>
    ) => {
      if (!action.payload.user) {
        return
      }
      state.send.status = 'SEND'
      state.send.source = action.payload.source
      state.send.user = action.payload.user
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
    },
    fetchRecentTips: (
      state,
      action: PayloadAction<{
        storage: Nullable<RecentTipsStorage>
      }>
    ) => {},
    setRecentTips: (
      state,
      action: PayloadAction<{ recentTips: UserTip[] }>
    ) => {
      state.recentTips = action.payload.recentTips
    },
    fetchUserSupporter: (
      state,
      action: PayloadAction<{
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
    hideTip: (state) => {
      state.showTip = false
    }
  }
})

export const {
  setSupportingForUser,
  setSupportingOverridesForUser,
  setSupportersForUser,
  setSupportersOverridesForUser,
  refreshSupport,
  fetchSupportingForUser,
  beginTip,
  sendTip,
  confirmSendTip,
  convert,
  sendTipSucceeded,
  sendTipFailed,
  resetSend,
  fetchRecentTips,
  setRecentTips,
  fetchUserSupporter,
  setTipToDisplay,
  hideTip
} = slice.actions

export default slice.reducer
