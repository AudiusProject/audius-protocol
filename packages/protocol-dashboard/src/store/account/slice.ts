import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Address, Status, DelayedPendingTransaction } from 'types'

export type State = {
  loggedIn: boolean
  status?: Status
  wallet?: Address
  pendingClaim: {
    status: Status
    hasClaim?: boolean
  }
  pendingTransactions: {
    status?: Status
    transactions?: Array<DelayedPendingTransaction>
  }
  error?: string
  isAudiusProfileRefetchDisabled?: boolean
}

export const initialState: State = {
  loggedIn: false,
  pendingClaim: {
    status: Status.Loading
  },
  pendingTransactions: {}
}

type SetAccount =
  | {
      status: Status.Success
      wallet: Address
    }
  | {
      status: Status.Failure
      error: string
    }

const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.status = Status.Loading
    },
    setAccount: (state, action: PayloadAction<SetAccount>) => {
      state.status = action.payload.status
      if ('wallet' in action.payload) {
        state.loggedIn = true
        state.wallet = action.payload.wallet
      } else {
        state.error = action.payload.error
      }
    },
    setPendingTransactionsLoading: (state) => {
      state.pendingTransactions.status = Status.Loading
    },
    setPendingClaimLoading: (state) => {
      state.pendingClaim.status = Status.Loading
    },
    setPendingClaim: (state, action: PayloadAction<boolean>) => {
      state.pendingClaim.hasClaim = action.payload
      state.pendingClaim.status = Status.Success
    },
    setPendingTransactions: (
      state,
      action: PayloadAction<Array<DelayedPendingTransaction>>
    ) => {
      state.pendingTransactions.status = Status.Success
      state.pendingTransactions.transactions = action.payload
    },
    disableAudiusProfileRefetch: (state) => {
      state.isAudiusProfileRefetchDisabled = true
    }
  }
})

export const {
  setAccount,
  setLoading,
  setPendingTransactionsLoading,
  setPendingTransactions,
  setPendingClaimLoading,
  setPendingClaim,
  disableAudiusProfileRefetch
} = slice.actions

export default slice.reducer
