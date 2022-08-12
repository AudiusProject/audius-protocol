import { Status } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum BuyAudioStage {
  START = 'START',
  PURCHASING = 'PURCHASING',
  CONFIRMING_PURCHASE = 'CONFIRMING_PURCHASE',
  SWAPPING = 'SWAPPING',
  CONFIRMING_SWAP = 'CONFIRMING_SWAP',
  TRANSFERRING = 'TRANSFERRING',
  FINISH = 'FINISH'
}

type AmountObject = {
  amount: number
  uiAmount: number
  uiAmountString: string
}

type PurchaseInfo = {
  estimatedSOL: AmountObject
  estimatedUSD: AmountObject
  desiredAudioAmount: AmountObject
}
type CalculateAudioPurchaseInfoPayload = { audioAmount: number }
type CalculateAudioPurchaseInfoSucceededPayload = PurchaseInfo

type BuyAudioState = {
  stage: BuyAudioStage
  purchaseInfoStatus: Status
  purchaseInfo?: PurchaseInfo
  feesCache: {
    associatedTokenAccountCache: Record<string, boolean>
    transactionFees: number
  }
}

const initialState: BuyAudioState = {
  stage: BuyAudioStage.START,
  feesCache: {
    associatedTokenAccountCache: {},
    transactionFees: 0
  },
  purchaseInfoStatus: Status.IDLE
}

const slice = createSlice({
  name: 'ui/buy-audio',
  initialState,
  reducers: {
    calculateAudioPurchaseInfo: (
      state,
      action: PayloadAction<CalculateAudioPurchaseInfoPayload>
    ) => {
      state.purchaseInfoStatus = Status.LOADING
    },
    calculateAudioPurchaseInfoSucceeded: (
      state,
      action: PayloadAction<CalculateAudioPurchaseInfoSucceededPayload>
    ) => {
      state.purchaseInfo = action.payload
      state.purchaseInfoStatus = Status.SUCCESS
    },
    cacheAssociatedTokenAccount: (
      state,
      {
        payload: { account, exists }
      }: PayloadAction<{ account: string; exists: boolean }>
    ) => {
      state.feesCache.associatedTokenAccountCache[account] = exists
    },
    cacheTransactionFees: (
      state,
      {
        payload: { transactionFees }
      }: PayloadAction<{ transactionFees: number }>
    ) => {
      state.feesCache.transactionFees = transactionFees
    },
    clearFeesCache: (state) => {
      state.feesCache = initialState.feesCache
    },
    restart: (state) => {
      state.stage = BuyAudioStage.START
    },
    onRampOpened: (state, _action: PayloadAction<PurchaseInfo>) => {
      state.stage = BuyAudioStage.PURCHASING
    },
    onRampCanceled: (state) => {
      state.stage = BuyAudioStage.START
    },
    onRampSucceeded: (state) => {
      state.stage = BuyAudioStage.CONFIRMING_PURCHASE
    },
    swapStarted: (state) => {
      state.stage = BuyAudioStage.SWAPPING
    },
    swapCompleted: (state) => {
      state.stage = BuyAudioStage.CONFIRMING_SWAP
    },
    transferStarted: (state) => {
      state.stage = BuyAudioStage.TRANSFERRING
    },
    transferCompleted: (state) => {
      state.stage = BuyAudioStage.FINISH
    }
  }
})

export const {
  calculateAudioPurchaseInfo,
  calculateAudioPurchaseInfoSucceeded,
  cacheAssociatedTokenAccount,
  cacheTransactionFees,
  clearFeesCache,
  restart,
  onRampOpened,
  onRampSucceeded,
  onRampCanceled,
  swapStarted,
  swapCompleted,
  transferStarted,
  transferCompleted
} = slice.actions

export default slice.reducer
