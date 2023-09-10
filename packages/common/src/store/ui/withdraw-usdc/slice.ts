import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'models/Status'

type WithdrawUSDCState = {
  withdrawStatus: Status
  destinationAddress?: string
  amount?: number
  withdrawError?: Error
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
    setDestinationAddress: (
      _state,
      _action: PayloadAction<{
        destinationAddress: string
      }>
    ) => {
      // triggers saga
    },
    setDestinationAddressSucceeded: (
      state,
      action: PayloadAction<{
        destinationAddress: string
      }>
    ) => {
      state.destinationError = undefined
      state.destinationAddress = action.payload.destinationAddress
    },
    setDestinationAddressFailed: (
      state,
      action: PayloadAction<{ error: Error }>
    ) => {
      state.destinationError = action.payload.error
    },
    setAmount: (
      _state,
      _action: PayloadAction<{
        amount: number
      }>
    ) => {
      // triggers saga
    },
    setAmountSucceeded: (
      state,
      action: PayloadAction<{
        amount: number
      }>
    ) => {
      state.amountError = undefined
      state.amount = action.payload.amount
    },
    setAmountFailed: (state, action: PayloadAction<{ error: Error }>) => {
      state.amountError = action.payload.error
    },
    beginWithdrawUSDC: (
      state,
      _action: PayloadAction<{
        amount: number
        destinationAddress: string
        onSuccess: (transaction: string) => void
      }>
    ) => {
      state.withdrawStatus = Status.LOADING
    },
    withdrawUSDCSucceeded: (state) => {
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
  setDestinationAddress,
  setDestinationAddressSucceeded,
  setDestinationAddressFailed,
  setAmount,
  setAmountSucceeded,
  setAmountFailed,
  beginWithdrawUSDC,
  withdrawUSDCSucceeded,
  withdrawUSDCFailed,
  cleanup
} = slice.actions

export default slice.reducer
export const actions = slice.actions
