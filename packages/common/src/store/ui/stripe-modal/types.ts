import { Action } from '@reduxjs/toolkit'

export type StripeSessionStatus =
  | 'initialized'
  | 'rejected'
  | 'requires_payment'
  | 'fulfillment_processing'
  | 'fulfillment_complete'

export type StripeDestinationCurrencyType = 'sol' | 'usdc'

export type StripeModalState = {
  onrampSucceeded?: Action
  onrampCanceled?: Action
  onrampFailed?: Action
  stripeSessionStatus?: StripeSessionStatus
  stripeClientSecret?: string
}

export type StripeSessionCreationErrorResponseData = {
  error: string
  code: string
  message: string
  type: string
}

export class StripeSessionCreationError extends Error {
  constructor(
    public code: string,
    // Avoiding `message` to not shadow the `message` property on Error
    public stripeErrorMessage: string,
    public type: string
  ) {
    super(`Failed to create Stripe session: ${stripeErrorMessage}`)
  }
}
