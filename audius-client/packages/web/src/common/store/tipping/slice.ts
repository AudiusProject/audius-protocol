import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { BNWei } from 'common/models/Wallet'
import { TippingState } from 'common/store/tipping/types'

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
    setSupporters: (
      state,
      action: PayloadAction<{ supporters: Record<ID, Supporter[]> }>
    ) => {
      state.supporters = action.payload.supporters
    },
    setSupportersforUser: (
      state,
      action: PayloadAction<{ userId: ID; supportersForUser: Supporter[] }>
    ) => {
      const { userId, supportersForUser } = action.payload
      state.supporters[userId] = supportersForUser
    },
    setSupporting: (
      state,
      action: PayloadAction<{ supporting: Record<ID, Supporting[]> }>
    ) => {
      state.supporting = action.payload.supporting
    },
    setSupportingforUser: (
      state,
      action: PayloadAction<{ userId: ID; supportingForUser: Supporting[] }>
    ) => {
      const { userId, supportingForUser } = action.payload
      state.supporting[userId] = supportingForUser
    },
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
  beginTip,
  sendTip,
  confirmSendTip,
  sendTipSucceeded,
  sendTipFailed,
  resetSend
} = slice.actions

export default slice.reducer
