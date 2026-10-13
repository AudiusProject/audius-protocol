import { lazySagas } from '~/utils/lazySagas'

import {
  cancelStripeOnramp,
  initializeStripeModal,
  stripeSessionStatusChanged
} from './slice'

/** Loads the Stripe onramp sagas when the onramp is first opened */
export default function sagas() {
  return [
    lazySagas({
      pattern: [
        initializeStripeModal.type,
        stripeSessionStatusChanged.type,
        cancelStripeOnramp.type
      ],
      load: () => import('./sagas')
    })
  ]
}
