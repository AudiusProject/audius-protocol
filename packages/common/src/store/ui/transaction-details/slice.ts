import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from '../../../models'

import { TransactionDetails, TransactionDetailsState } from './types'

const initialState: TransactionDetailsState = {
  status: Status.IDLE
}

const slice = createSlice({
  name: 'ui/transaction-details',
  initialState: initialState as TransactionDetailsState,
  reducers: {
    fetchTransactionDetails: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      return {
        status: Status.LOADING,
        transactionId: action.payload.transactionId,
        onModalCloseAction: state.onModalCloseAction
      }
    },
    fetchTransactionDetailsSucceeded: (
      state,
      action: PayloadAction<{
        transactionId: string
        transactionDetails: TransactionDetails
      }>
    ) => {
      return {
        status: Status.SUCCESS,
        transactionId: action.payload.transactionId,
        transactionDetails: action.payload.transactionDetails,
        onModalCloseAction: state.onModalCloseAction
      }
    },
    fetchTransactionDetailsFailed: (state) => {
      return {
        status: Status.ERROR,
        onModalCloseAction: state.onModalCloseAction
      }
    },
    setModalClosedAction: (
      state,
      action: PayloadAction<Action | undefined>
    ) => {
      return { ...state, onModalCloseAction: action.payload }
    }
  }
})

export const {
  fetchTransactionDetails,
  fetchTransactionDetailsSucceeded,
  fetchTransactionDetailsFailed,
  setModalClosedAction
} = slice.actions
export default slice.reducer
export const actions = slice.actions
