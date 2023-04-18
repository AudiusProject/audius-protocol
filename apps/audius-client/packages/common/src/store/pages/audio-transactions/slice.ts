import { full } from '@audius/sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from '../../../models/Status'
import { TransactionDetails } from '../../ui/transaction-details/types'

type FetchAudioTransactionsPayload = {
  offset?: number
  limit?: number
  sortMethod?: full.GetAudioTransactionHistorySortMethodEnum
  sortDirection?: full.GetAudioTransactionHistorySortDirectionEnum
}

type TransactionsUIState = {
  transactionsCount: number
  transactionsCountStatus: Status
  transactions: (TransactionDetails | {})[]
  transactionsStatus: Status
}

const initialState: TransactionsUIState = {
  transactionsCount: 0,
  transactionsCountStatus: Status.IDLE,
  transactions: [],
  transactionsStatus: Status.IDLE
}

const slice = createSlice({
  name: 'audio-transactions-page',
  initialState,
  reducers: {
    fetchAudioTransactionsCount: (state) => {
      state.transactionsCountStatus = Status.LOADING
    },
    fetchAudioTransactionsCountSucceeded: (
      state,
      action: PayloadAction<{ count: number }>
    ) => {
      state.transactionsCount = action.payload.count
      state.transactionsCountStatus = Status.SUCCESS
    },
    fetchAudioTransactions: (
      state,
      action: PayloadAction<FetchAudioTransactionsPayload>
    ) => {
      if (action.payload.offset === 0) {
        // offset of 0 resets pagination
        state.transactions = []
        state.transactionsStatus = Status.LOADING
      }
    },
    fetchAudioTransactionsSucceeded: (
      state,
      action: PayloadAction<{
        txDetails: (TransactionDetails | {})[]
        offset?: number
      }>
    ) => {
      const { txDetails, offset } = action.payload
      const transactionsCopy = [...state.transactions]
      transactionsCopy.splice(offset ?? 0, txDetails.length, ...txDetails)
      state.transactions = transactionsCopy
      state.transactionsStatus = Status.SUCCESS
    },
    fetchAudioTransactionMetadata: (
      _state,
      _action: PayloadAction<{ txDetails: TransactionDetails }>
    ) => {}
  }
})

export const {
  fetchAudioTransactions,
  fetchAudioTransactionMetadata,
  fetchAudioTransactionsCount
} = slice.actions

export default slice

export const actions = slice.actions
