import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { Nullable } from 'common/utils/typeUtils'

import { StringWei } from '../../common/models/Wallet'

type WalletState = {
  balance: Nullable<StringWei>
  totalBalance: Nullable<StringWei>
  localBalanceDidChange: boolean
}

const initialState: WalletState = {
  balance: null,
  totalBalance: null,
  localBalanceDidChange: false
}

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
      state.localBalanceDidChange = true
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
      state.localBalanceDidChange = true
    },
    // Saga Actions
    getBalance: () => {},
    claim: () => {},
    claimSucceeded: () => {},
    claimFailed: (state, action: PayloadAction<{ error?: string }>) => {},
    send: (
      state,
      action: PayloadAction<{ recipientWallet: string; amount: StringWei }>
    ) => {},
    sendSucceeded: () => {},
    sendFailed: (state, action: PayloadAction<{ error?: string }>) => {}
  }
})

export const {
  setBalance,
  increaseBalance,
  decreaseBalance,
  getBalance,
  claim,
  claimSucceeded,
  claimFailed,
  send,
  sendSucceeded,
  sendFailed
} = slice.actions
export default slice.reducer
