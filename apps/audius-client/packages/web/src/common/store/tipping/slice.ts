import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { BNWei } from 'common/models/Wallet'
import { TippingState } from 'common/store/tipping/types'

export type RefreshSupportPayloadAction = {
  senderUserId: ID
  receiverUserId: ID
  supportingLimit?: number
  supportersLimit?: number
}

const initialState: TippingState = {
  supporters: {},
  supporting: {},
  send: {
    status: null,
    user: null,
    amount: new BN('0') as BNWei,
    error: null
  }
}

const slice = createSlice({
  name: 'tipping',
  initialState,
  reducers: {
    setSupportersForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportersForUser: Record<ID, Supporter>
      }>
    ) => {
      const { id, supportersForUser } = action.payload
      state.supporters[id] = {
        ...state.supporters[id],
        ...supportersForUser
      }
    },
    setSupportingForUser: (
      state,
      action: PayloadAction<{
        id: ID
        supportingForUser: Record<ID, Supporting>
      }>
    ) => {
      const { id, supportingForUser } = action.payload
      state.supporting[id] = {
        ...state.supporting[id],
        ...supportingForUser
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
    beginTip: (state, action: PayloadAction<{ user: User | null }>) => {
      if (!action.payload.user) {
        return
      }
      state.send.status = 'SEND'
      state.send.user = action.payload.user
    },
    sendTip: (state, action: PayloadAction<{ amount: BNWei }>) => {
      if (state.send.status !== 'SEND') {
        return
      }
      state.send.status = 'CONFIRM'
      state.send.amount = action.payload.amount
    },
    confirmSendTip: state => {
      if (state.send.status !== 'CONFIRM' && state.send.status !== 'ERROR') {
        return
      }
      state.send.status = 'SENDING'
    },
    convert: state => {
      if (state.send.status !== 'SENDING') {
        return
      }
      state.send.status = 'CONVERTING'
    },
    sendTipSucceeded: state => {
      state.send.status = 'SUCCESS'
    },
    sendTipFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.send.status = 'ERROR'
      state.send.error = action.payload.error
    },
    resetSend: state => {
      state.send.status = null
      state.send.user = null
      state.send.amount = new BN('0') as BNWei
      state.send.error = null
    }
  }
})

export const {
  setSupportingForUser,
  setSupportersForUser,
  refreshSupport,
  fetchSupportingForUser,
  beginTip,
  sendTip,
  confirmSendTip,
  convert,
  sendTipSucceeded,
  sendTipFailed,
  resetSend
} = slice.actions

export default slice.reducer
