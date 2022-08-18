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
  isError: false
  estimatedSOL: AmountObject
  estimatedUSD: AmountObject
  desiredAudioAmount: AmountObject
}
export enum PurchaseInfoErrorType {
  MAX_AUDIO_EXCEEDED = 'max_audio_exceeded',
  MIN_AUDIO_EXCEEDED = 'min_audio_exceeded',
  UNKNOWN = 'unknown'
}
type PurchaseInfoMaxAudioExceededError = {
  errorType: PurchaseInfoErrorType.MAX_AUDIO_EXCEEDED
  maxAudio: number
}
type PurchaseInfoMinAudioExceededError = {
  errorType: PurchaseInfoErrorType.MIN_AUDIO_EXCEEDED
  minAudio: number
}
type PurchaseInfoUnknownError = {
  errorType: PurchaseInfoErrorType.UNKNOWN
}
type PurchaseInfoError =
  | PurchaseInfoMaxAudioExceededError
  | PurchaseInfoMinAudioExceededError
  | PurchaseInfoUnknownError

type CalculateAudioPurchaseInfoPayload = { audioAmount: number }
type CalculateAudioPurchaseInfoSucceededPayload = Omit<PurchaseInfo, 'isError'>
type CalculateAudioPurchaseInfoFailedPayload = PurchaseInfoError
type BuyAudioState = {
  stage: BuyAudioStage
  purchaseInfoStatus: Status
  purchaseInfo?: PurchaseInfo | (PurchaseInfoError & { isError: true })
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
      state.purchaseInfo = { isError: false, ...action.payload }
      state.purchaseInfoStatus = Status.SUCCESS
    },
    calculateAudioPurchaseInfoFailed: (
      state,
      action: PayloadAction<CalculateAudioPurchaseInfoFailedPayload>
    ) => {
      state.purchaseInfo = {
        isError: true,
        ...action.payload
      }
      state.purchaseInfoStatus = Status.ERROR
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
  calculateAudioPurchaseInfoFailed,
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
