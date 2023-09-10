import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { Nullable } from 'utils/typeUtils'

import { Chain } from '../../models/Chain'
import { StringUSDC, StringWei } from '../../models/Wallet'

type WalletState = {
  balance: Nullable<StringWei>
  balanceLoading: boolean
  totalBalance: Nullable<StringWei>
  localBalanceDidChange: boolean
  freezeBalanceUntil: Nullable<number>
  usdcBalance: Nullable<StringUSDC>
}

const initialState: WalletState = {
  balance: null,
  balanceLoading: true,
  totalBalance: null,
  localBalanceDidChange: false,
  freezeBalanceUntil: null,
  usdcBalance: null
}

// After optimistically updating the balance, it can be useful
// to briefly freeze the value so fetching an outdated
// value from chain doesn't overwrite the state.
const BALANCE_FREEZE_DURATION_SEC = 15

const slice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (
      state,
      {
        payload: { balance, totalBalance }
      }: PayloadAction<{ balance: StringWei; totalBalance?: StringWei }>
    ) => {
      state.balance = balance
      state.balanceLoading = false
      if (totalBalance) state.totalBalance = totalBalance
      state.localBalanceDidChange = false
    },
    increaseBalance: (
      state,
      { payload: { amount } }: PayloadAction<{ amount: StringWei }>
    ) => {
      if (!state.balance) return
      const existingBalance = new BN(state.balance)
      state.balance = existingBalance
        .add(new BN(amount))
        .toString() as StringWei
      if (state.totalBalance) {
        state.totalBalance = new BN(state.totalBalance)
          .add(new BN(amount))
          .toString() as StringWei
      }
      state.localBalanceDidChange = true
      state.freezeBalanceUntil = Date.now() + BALANCE_FREEZE_DURATION_SEC * 1000
    },
    decreaseBalance: (
      state,
      { payload: { amount } }: PayloadAction<{ amount: StringWei }>
    ) => {
      if (!state.balance) return
      const existingBalance = new BN(state.balance)
      state.balance = existingBalance
        .sub(new BN(amount))
        .toString() as StringWei
      if (state.totalBalance) {
        state.totalBalance = new BN(state.totalBalance)
          .sub(new BN(amount))
          .toString() as StringWei
      }
      state.localBalanceDidChange = true
      state.freezeBalanceUntil = Date.now() + BALANCE_FREEZE_DURATION_SEC * 1000
    },
    setUSDCBalance: (
      state,
      { payload: { amount } }: PayloadAction<{ amount: StringUSDC }>
    ) => {
      state.usdcBalance = amount
    },
    // Saga Actions
    getBalance: () => {},
    claim: () => {},
    claimSucceeded: () => {},
    claimFailed: (_state, _action: PayloadAction<{ error?: string }>) => {},
    send: (
      _state,
      _action: PayloadAction<{
        recipientWallet: string
        amount: StringWei
        chain: Chain
      }>
    ) => {},
    sendSucceeded: () => {},
    sendFailed: (_state, _action: PayloadAction<{ error?: string }>) => {}
  }
})

export const {
  setBalance,
  increaseBalance,
  decreaseBalance,
  setUSDCBalance,
  getBalance,
  claim,
  claimSucceeded,
  claimFailed,
  send,
  sendSucceeded,
  sendFailed
} = slice.actions
export default slice.reducer
export const actions = slice.actions
