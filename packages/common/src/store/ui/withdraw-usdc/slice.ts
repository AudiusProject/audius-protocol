import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'models/Status'

type WithdrawUSDCState = {
  withdrawStatus: Status
  destinationAddress?: string
  amount?: number
  withdrawError?: Error
  withdrawTransaction?: string
  destinationError?: Error
  amountError?: Error
}

const initialState: WithdrawUSDCState = {
  withdrawStatus: Status.IDLE
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
  withdrawUSDCSucceeded,
  withdrawUSDCFailed,
  cleanup
} = slice.actions

export default slice.reducer
export const actions = slice.actions
