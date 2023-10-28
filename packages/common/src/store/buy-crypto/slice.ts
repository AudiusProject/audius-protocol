import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { MintName } from 'services/index'
import { OnRampProvider } from 'store/ui/buy-audio/types'

type BuyCryptoPayload = {
  /**
   * The amount the user is requesting, in user friendly decimal denomination
   */
  amount: number
  /**
   * The mint name of the token the user wants to purchase
   */
  mint: MintName
  /**
   * The service used to purchase the SOL necessary
   */
  provider: OnRampProvider
}

type BuyCryptoState = {}

const initialState: BuyCryptoState = {}

const slice = createSlice({
  name: 'buy-crypto',
  initialState,
  reducers: {
    buyCryptoViaSol: (_state, _action: PayloadAction<BuyCryptoPayload>) => {
      // Triggers saga
    },
    onrampSucceeded: () => {
      // handled by saga
    },
    onrampCanceled: () => {
      // handled by saga
    },
    onrampFailed: (_state, _action: PayloadAction<{ error: Error }>) => {
      // handled by saga
    }
  }
})

export const {
  buyCryptoViaSol,
  onrampSucceeded,
  onrampCanceled,
  onrampFailed
} = slice.actions

export default slice.reducer
export const actions = slice.actions
