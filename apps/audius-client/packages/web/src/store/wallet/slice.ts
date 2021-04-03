import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'
import { AppState } from 'store/types'
import {
  WEI,
  trimRightZeros,
  formatNumberCommas,
  formatWeiToAudioString,
  parseWeiNumber
} from 'utils/formatUtil'
import { Brand, Nullable } from 'utils/typeUtils'

export type StringWei = Brand<string, 'stringWEI'>
export type StringAudio = Brand<string, 'stringAudio'>
export type BNWei = Brand<BN, 'BNWei'>
export type BNAudio = Brand<BN, 'BNAudio'>

export type WalletAddress = string

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

// Conversion Fns

export const weiToAudioString = (bnWei: BNWei): StringAudio => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringAudio
  return stringAudio
}

export const weiToAudio = (bnWei: BNWei): BNAudio => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringAudio
  return stringAudioToBN(stringAudio)
}

export const audioToWei = (stringAudio: StringAudio): BNWei => {
  const wei = parseWeiNumber(stringAudio) as BNWei
  return wei
}

export const stringWeiToBN = (stringWei: StringWei): BNWei => {
  return new BN(stringWei) as BNWei
}

export const stringAudioToBN = (stringAudio: StringAudio): BNAudio => {
  return new BN(stringAudio) as BNAudio
}

export const stringWeiToAudioBN = (stringWei: StringWei): BNAudio => {
  const bnWei = stringWeiToBN(stringWei)
  const stringAudio = weiToAudioString(bnWei)
  return new BN(stringAudio) as BNAudio
}

export const weiToString = (wei: BNWei): StringWei => {
  return wei.toString() as StringWei
}

/**
 * Format wei BN to the full $AUDIO currency with decimals
 * @param {BN} amount The wei amount
 * @param {boolean} shouldTruncate truncate decimals at truncation length
 * @param {number} significantDigits if truncation set to true, how many significant digits to include
 * @returns {string} $AUDIO The $AUDIO amount with decimals
 */
export const formatWei = (
  amount: BNWei,
  shouldTruncate = false,
  significantDigits = 4
): StringAudio => {
  const aud = amount.div(WEI)
  const wei = amount.sub(aud.mul(WEI))
  if (wei.isZero()) {
    return formatNumberCommas(aud.toString()) as StringAudio
  }
  const decimals = wei.toString().padStart(18, '0')

  let trimmed = `${aud}.${trimRightZeros(decimals)}`
  if (shouldTruncate) {
    let [before, after] = trimmed.split('.')
    // If we have only zeros, just lose the decimal
    after = after.substr(0, significantDigits)
    if (parseInt(after) === 0) {
      trimmed = before
    } else {
      trimmed = `${before}.${after}`
    }
  }
  return formatNumberCommas(trimmed) as StringAudio
}

// Selectors
export const getAccountBalance = (state: AppState): Nullable<BNWei> => {
  const balance = state.wallet.balance
  if (!balance) return null
  return stringWeiToBN(balance)
}

export const getAccountTotalBalance = (state: AppState): Nullable<BNWei> => {
  const totalBalance = state.wallet.totalBalance
  if (!totalBalance) return null
  return stringWeiToBN(totalBalance)
}
export const getLocalBalanceDidChange = (state: AppState): boolean => {
  return state.wallet.localBalanceDidChange
}

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
