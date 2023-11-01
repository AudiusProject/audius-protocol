import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { StripeSessionCreationError } from '..'

import {
  BuyUSDCStage,
  USDCOnRampProvider,
  PurchaseInfo,
  BuyUSDCError
} from './types'

type StripeSessionStatus =
  | 'initialized'
  | 'rejected'
  | 'requires_payment'
  | 'fulfillment_processing'
  | 'fulfillment_complete'

type OnSuccess = {
  action?: Action
  message?: string
}

type RecoveryStatus = 'idle' | 'in-progress' | 'success' | 'failure'

type BuyUSDCState = {
  stage: BuyUSDCStage
  error?: BuyUSDCError
  provider: USDCOnRampProvider
  onSuccess?: OnSuccess
  stripeSessionStatus?: StripeSessionStatus
  recoveryStatus: RecoveryStatus
}

const initialState: BuyUSDCState = {
  provider: USDCOnRampProvider.UNKNOWN,
  stage: BuyUSDCStage.START,
  recoveryStatus: 'idle'
}

const slice = createSlice({
  name: 'buy-usdc',
  initialState,
  reducers: {
    onrampOpened: (
      state,
      action: PayloadAction<{
        purchaseInfo: PurchaseInfo
        provider: USDCOnRampProvider
      }>
    ) => {
      state.stage = BuyUSDCStage.START
      state.error = undefined
      state.provider = action.payload.provider
    },
    purchaseStarted: (state) => {
      state.stage = BuyUSDCStage.PURCHASING
    },
    onrampCanceled: (state) => {
      if (state.stage === BuyUSDCStage.PURCHASING) {
        state.stage = BuyUSDCStage.CANCELED
      }
    },
    onrampSucceeded: (state) => {
      state.stage = BuyUSDCStage.CONFIRMING_PURCHASE
    },
    onrampFailed: (
      _state,
      _action: PayloadAction<{ error: StripeSessionCreationError }>
    ) => {
      // handled by saga
    },
    buyUSDCFlowFailed: (
      state,
      action: PayloadAction<{ error: BuyUSDCError }>
    ) => {
      state.error = action.payload.error
    },
    buyUSDCFlowSucceeded: (state) => {
      state.stage = BuyUSDCStage.FINISH
    },
    stripeSessionStatusChanged: (
      state,
      action: PayloadAction<{ status: StripeSessionStatus }>
    ) => {
      state.stripeSessionStatus = action.payload.status
    },
    startRecoveryIfNecessary: () => {
      // triggers sagas
    },
    recoveryStatusChanged: (
      state,
      action: PayloadAction<{ status: RecoveryStatus }>
    ) => {
      state.recoveryStatus = action.payload.status
    },
    cleanup: () => initialState
  }
})

export const {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampOpened,
  purchaseStarted,
  onrampSucceeded,
  onrampCanceled,
  onrampFailed,
  stripeSessionStatusChanged,
  startRecoveryIfNecessary,
  recoveryStatusChanged,
  cleanup
} = slice.actions

export default slice.reducer
export const actions = slice.actions
