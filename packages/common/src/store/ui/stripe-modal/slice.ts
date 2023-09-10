import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  StripeSessionStatus,
  StripeModalState,
  StripeDestinationCurrencyType
} from './types'

type InitializeStripeModalPayload = {
  amount: string
  destinationCurrency: StripeDestinationCurrencyType
  destinationWallet: string
  onrampSucceeded: Action
  onrampCanceled: Action
}

const initialState: StripeModalState = {}

const slice = createSlice({
  name: 'ui/stripe-modal',
  initialState,
  reducers: {
    initializeStripeModal: (
      state,
      action: PayloadAction<InitializeStripeModalPayload>
    ) => {
      state.stripeSessionStatus = 'initialized'
      state.onrampSucceeded = action.payload.onrampSucceeded
      state.onrampCanceled = action.payload.onrampCanceled
    },
    stripeSessionCreated: (
      state,
      action: PayloadAction<{ clientSecret: string }>
    ) => {
      state.stripeClientSecret = action.payload.clientSecret
    },
    // Handled by saga
    cancelStripeOnramp: () => {},
    stripeSessionStatusChanged: (
      state,
      action: PayloadAction<{ status: StripeSessionStatus }>
    ) => {
      state.stripeSessionStatus = action.payload.status
    }
  }
})

export const {
  initializeStripeModal,
  stripeSessionCreated,
  cancelStripeOnramp,
  stripeSessionStatusChanged
} = slice.actions

export default slice.reducer
export const actions = slice.actions
