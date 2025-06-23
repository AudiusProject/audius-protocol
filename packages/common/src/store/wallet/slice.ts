import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { isNullOrUndefined, Nullable } from '~/utils/typeUtils'

import { StringUSDC, StringWei } from '../../models/Wallet'

type WalletState = {
  balance: Nullable<StringWei>
  balanceLoading: boolean
  balanceLoadDidFail: Nullable<boolean>
  totalBalance: Nullable<StringWei>
  totalBalanceLoadDidFail: Nullable<boolean>
  localBalanceDidChange: boolean
  freezeBalanceUntil: Nullable<number>
  usdcBalance: Nullable<StringUSDC>
}

const initialState: WalletState = {
  balance: null,
  balanceLoading: true,
  balanceLoadDidFail: false,
  totalBalance: null,
  totalBalanceLoadDidFail: false,
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
      state.balanceLoadDidFail = false
      if (!isNullOrUndefined(totalBalance)) {
        state.totalBalance = totalBalance
        state.totalBalanceLoadDidFail = false
      }
      state.localBalanceDidChange = false
    },
    setBalanceError: (
      state,
      {
        payload: { balanceLoadDidFail, totalBalanceLoadDidFail }
      }: PayloadAction<{
        balanceLoadDidFail?: boolean
        totalBalanceLoadDidFail?: boolean
      }>
    ) => {
      if (balanceLoadDidFail != null) {
        state.balanceLoadDidFail = balanceLoadDidFail
      }
      if (totalBalanceLoadDidFail != null) {
        state.totalBalanceLoadDidFail = totalBalanceLoadDidFail
      }
    },
    increaseBalance: (
      state,
      { payload: { amount } }: PayloadAction<{ amount: StringWei }>
    ) => {
      if (isNullOrUndefined(state.balance)) return
      const existingBalance = AUDIO(state.balance).value
      state.balance = (
        existingBalance + AUDIO(amount).value
      ).toString() as StringWei
      if (!isNullOrUndefined(state.totalBalance)) {
        state.totalBalance = (
          AUDIO(state.totalBalance).value + AUDIO(amount).value
        ).toString() as StringWei
      }
      state.localBalanceDidChange = true
      state.freezeBalanceUntil = Date.now() + BALANCE_FREEZE_DURATION_SEC * 1000
    },
    decreaseBalance: (
      state,
      { payload: { amount } }: PayloadAction<{ amount: StringWei }>
    ) => {
      if (!state.balance) return
      const existingBalance = BigInt(state.balance) as AudioWei
      state.balance = (
        existingBalance - (BigInt(amount) as AudioWei)
      ).toString() as StringWei
      if (state.totalBalance) {
        state.totalBalance = (
          (BigInt(state.totalBalance) as AudioWei) -
          (BigInt(amount) as AudioWei)
        ).toString() as StringWei
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
