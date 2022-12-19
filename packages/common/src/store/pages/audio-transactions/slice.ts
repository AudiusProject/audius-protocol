import { full } from '@audius/sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TransactionDetails } from '../../ui/transaction-details/types'

type FetchAudioTransactionsPayload = {
  offset?: number
  limit?: number
  sortMethod?: full.GetAudioTransactionHistorySortMethodEnum
  sortDirection?: full.GetAudioTransactionHistorySortDirectionEnum
}

type TransactionsUIState = {
  transactionsCount: number
  transactions: (TransactionDetails | {})[]
}

const initialState: TransactionsUIState = {
  transactionsCount: 0,
  transactions: []
}

const slice = createSlice({
  name: 'audio-transactions-page',
  initialState,
  reducers: {
    fetchAudioTransactionsCount: () => {},
    setAudioTransactionsCount: (
      state,
      action: PayloadAction<{ count: number }>
    ) => {
      state.transactionsCount = action.payload.count
    },
    fetchAudioTransactions: (
      _state,
      _action: PayloadAction<FetchAudioTransactionsPayload>
    ) => {},
    fetchAudioTransactionMetadata: (
      _state,
      _action: PayloadAction<{ txDetails: TransactionDetails }>
    ) => {},
    setAudioTransactions: (
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
    }
  }
})

export const {
  fetchAudioTransactions,
  setAudioTransactions,
  fetchAudioTransactionMetadata,
  fetchAudioTransactionsCount,
  setAudioTransactionsCount
} = slice.actions

export default slice

export const actions = slice.actions
