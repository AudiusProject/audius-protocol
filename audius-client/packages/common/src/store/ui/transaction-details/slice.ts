import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
      _,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      return {
        status: Status.LOADING,
        transactionId: action.payload.transactionId
      }
    },
    fetchTransactionDetailsSucceeded: (
      _,
      action: PayloadAction<{
        transactionId: string
        transactionDetails: TransactionDetails
      }>
    ) => {
      return {
        status: Status.SUCCESS,
        transactionId: action.payload.transactionId,
        transactionDetails: action.payload.transactionDetails
      }
    },
    fetchTransactionDetailsFailed: (_) => {
      return { status: Status.ERROR }
    }
  }
})

export const {
  fetchTransactionDetails,
  fetchTransactionDetailsSucceeded,
  fetchTransactionDetailsFailed
} = slice.actions
export default slice.reducer
export const actions = slice.actions
