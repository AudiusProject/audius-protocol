import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'models/Status'

export enum CoinflowWithdrawalState {
  IDLE = 'IDLE',
  FUNDING_ROOT_WALLET = 'FUNDING_ROOT_WALLET',
  READY_FOR_WITHDRAWAL = 'READY_FOR_WITHDRAWAL',
  WITHDRAWING = 'WITHDRAWING',
  CANCELED = 'CANCELED',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

type WithdrawUSDCState = {
  withdrawStatus: Status
  coinflowState: CoinflowWithdrawalState
  destinationAddress?: string
  amount?: number
  withdrawError?: Error
  withdrawTransaction?: string
  destinationError?: Error
  amountError?: Error
}

const initialState: WithdrawUSDCState = {
  withdrawStatus: Status.IDLE,
  coinflowState: CoinflowWithdrawalState.IDLE
}

const slice = createSlice({
  name: 'withdraw-usdc',
  initialState,
  reducers: {
    beginWithdrawUSDC: (
      state,
      _action: PayloadAction<{
        /** Balance in cents. Used for analytics */
        currentBalance: number
        /** Transfer amount in cents */
        amount: number
        destinationAddress: string
      }>
    ) => {
      state.withdrawStatus = Status.LOADING
    },
    beginCoinflowWithdrawal: (state) => {
      state.coinflowState = CoinflowWithdrawalState.FUNDING_ROOT_WALLET
    },
    coinflowWithdrawalReady: (state) => {
      state.coinflowState = CoinflowWithdrawalState.READY_FOR_WITHDRAWAL
    },
    coinflowWithdrawalSucceeded: (state) => {
      state.coinflowState = CoinflowWithdrawalState.SUCCESS
    },
    coinflowWithdrawalCanceled: (state) => {
      state.coinflowState = CoinflowWithdrawalState.CANCELED
    },

    withdrawUSDCSucceeded: (
      state,
      action: PayloadAction<{ transaction: string }>
    ) => {
      state.withdrawTransaction = action.payload.transaction
      state.withdrawError = undefined
      state.withdrawStatus = Status.SUCCESS
    },
    withdrawUSDCFailed: (state, action: PayloadAction<{ error: Error }>) => {
      state.withdrawStatus = Status.ERROR
      state.withdrawError = action.payload.error
    },
    cleanup: () => initialState
  }
})

export const {
  beginWithdrawUSDC,
  beginCoinflowWithdrawal,
  coinflowWithdrawalReady,
  coinflowWithdrawalSucceeded,
  coinflowWithdrawalCanceled,
  withdrawUSDCSucceeded,
  withdrawUSDCFailed,
  cleanup
} = slice.actions

export default slice.reducer
export const actions = slice.actions
