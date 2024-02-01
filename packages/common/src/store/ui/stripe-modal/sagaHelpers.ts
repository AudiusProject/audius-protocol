import { call } from 'typed-redux-saga'

import { Name, StripeEventFields } from '~/models/Analytics'
import { ErrorLevel } from '~/models/ErrorReporting'
import { getContext } from '~/store/effects'

import { StripeSessionData } from './types'

const cleanSession = (session: StripeSessionData) => {
  const cleaned = { ...session }
  delete cleaned.client_secret
  return cleaned
}

/** Extracts the required analytics fields from the session. Since a majority of
 * the session is Nullable at any given time, it attempts to find preferred values
 * from the quote and fixed_transaction objects, falling back to empty strings.
 */
const getStripeEventFields = (
  session: StripeSessionData
): StripeEventFields => ({
  amount:
    session.quote?.destination_amount ??
    session.fixed_transaction_details?.destination_crypto_amount ??
    '',
  destinationCurrency:
    session.fixed_transaction_details?.destination_currency ??
    session.quote?.destination_currency.asset_code ??
    ''
})

export function* reportStripeFlowAnalytics(
  session: StripeSessionData,
  previousSession?: StripeSessionData
) {
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')

  if (!previousSession || session.status !== previousSession.status) {
    const cleanedSession = cleanSession(session)
    const eventFields = getStripeEventFields(session)
    switch (session.status) {
      case 'initialized':
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_MODAL_INITIALIZED,
            ...eventFields
          })
        )
        break
      case 'requires_payment':
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_REQUIRES_PAYMENT,
            ...eventFields
          })
        )
        break
      case 'rejected':
        yield* call(reportToSentry, {
          level: ErrorLevel.Error,
          error: new Error('Stripe onramp session status: rejected'),
          additionalInfo: {
            session: cleanedSession
          }
        })
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_REJECTED,
            ...eventFields
          })
        )
        break
      case 'fulfillment_complete':
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_FULLFILMENT_COMPLETE,
            ...eventFields
          })
        )
        break
      case 'fulfillment_processing':
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_FULLFILMENT_PROCESSING,
            ...eventFields
          })
        )
        break
      case 'error':
        yield* call(reportToSentry, {
          level: ErrorLevel.Error,
          error: new Error('Stripe onramp session status: error'),
          additionalInfo: {
            session: cleanedSession
          }
        })
        yield* call(
          track,
          make({
            eventName: Name.STRIPE_ERROR,
            ...eventFields
          })
        )
        break
    }
  }
}
