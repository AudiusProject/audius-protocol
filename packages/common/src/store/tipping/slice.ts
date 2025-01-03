import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TipSource } from '../../models/Analytics'
import { ID } from '../../models/Identifiers'
import { User } from '../../models/User'
import type { Nullable } from '../../utils/typeUtils'

import { TippingState } from './types'

const initialState: TippingState = {
  send: {
    status: null,
    user: null,
    amount: '0',
    error: null,
    source: 'profile',
    trackId: null
  }
}

const slice = createSlice({
  name: 'tipping',
  initialState,
  reducers: {
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
  sendTipFailed,
  sendTipSucceeded,
  refreshTipGatedTracks
} = slice.actions

export const actions = slice.actions

export default slice.reducer
