import { Action } from '@reduxjs/toolkit'

export type StripeSessionStatus =
  | 'initialized'
  | 'rejected'
  | 'requires_payment'
  | 'fulfillment_processing'
  | 'fulfillment_complete'

export type StripeDestinationCurrencyType = 'sol' | 'usdc'

export type StripeModalState = {
  onRampSucceeded?: Action
  onRampCanceled?: Action
  stripeSessionStatus?: StripeSessionStatus
  stripeClientSecret?: string
}
