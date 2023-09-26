import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID } from 'models/Identifiers'

import { ContentType, PurchaseContentStage } from './types'

type OnSuccess = {
  action?: Action
  message?: string
}

type PurchaseContentState = {
  stage: PurchaseContentStage
  contentType: ContentType
  contentId: ID
  /** Pay extra amount in cents */
  extraAmount?: number
  /** Used for analytics */
  extraAmountPreset?: string
  error?: Error
  onSuccess?: OnSuccess
}

const initialState: PurchaseContentState = {
  contentType: ContentType.TRACK,
  contentId: -1,
  extraAmount: undefined,
  extraAmountPreset: undefined,
  error: undefined,
  stage: PurchaseContentStage.START
}

const slice = createSlice({
  name: 'purchase-content',
  initialState,
  reducers: {
    startPurchaseContentFlow: (
      state,
      action: PayloadAction<{
        extraAmount?: number
        extraAmountPreset?: string
        contentId: ID
        contentType?: ContentType
        onSuccess?: OnSuccess
      }>
    ) => {
      state.stage = PurchaseContentStage.START
      state.error = undefined
      state.extraAmount = action.payload.extraAmount
      state.extraAmountPreset = action.payload.extraAmountPreset
      state.contentId = action.payload.contentId
      state.contentType = action.payload.contentType ?? ContentType.TRACK
      state.onSuccess = action.payload.onSuccess
    },
    buyUSDC: (state) => {
      state.stage = PurchaseContentStage.BUY_USDC
    },
    usdcBalanceSufficient: (state) => {
      state.stage = PurchaseContentStage.PURCHASING
    },
    purchaseCanceled: (state) => {
      state.stage = PurchaseContentStage.CANCELED
    },
    purchaseSucceeded: (state) => {
      state.stage = PurchaseContentStage.CONFIRMING_PURCHASE
    },
    purchaseConfirmed: (
      state,
      _action: PayloadAction<{
        contentType: ContentType
        contentId: ID
      }>
    ) => {
      state.stage = PurchaseContentStage.FINISH
    },
    purchaseContentFlowFailed: (state) => {
      state.error = new Error('Content purchase failed')
    },
    cleanup: () => initialState
  }
})

export const {
  startPurchaseContentFlow,
  buyUSDC,
  usdcBalanceSufficient,
  purchaseSucceeded,
  purchaseConfirmed,
  purchaseCanceled,
  purchaseContentFlowFailed
} = slice.actions

export default slice.reducer
export const actions = slice.actions
