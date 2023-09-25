import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { BuyUSDCStage, USDCOnRampProvider, PurchaseInfo } from './types'

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

type BuyUSDCState = {
  stage: BuyUSDCStage
  error?: Error
  provider: USDCOnRampProvider
  onSuccess?: OnSuccess
  stripeSessionStatus?: StripeSessionStatus
}

const initialState: BuyUSDCState = {
  provider: USDCOnRampProvider.UNKNOWN,
  stage: BuyUSDCStage.START
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
        onSuccess?: OnSuccess
      }>
    ) => {
      state.stage = BuyUSDCStage.START
      state.error = undefined
      state.provider = action.payload.provider
      state.onSuccess = action.payload.onSuccess
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
    buyUSDCFlowFailed: (state) => {
      state.error = new Error('USDC purchase failed')
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
      // triggers saga
    }
  }
})

export const {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampOpened,
  purchaseStarted,
  onrampSucceeded,
  onrampCanceled,
  stripeSessionStatusChanged,
  startRecoveryIfNecessary
} = slice.actions

export default slice.reducer
export const actions = slice.actions
