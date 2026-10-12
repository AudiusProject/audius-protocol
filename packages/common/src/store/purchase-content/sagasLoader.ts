import { lazySagas } from '~/utils/lazySagas'

import { eagerCreateUserBank, startPurchaseContentFlow } from './slice'

/** Loads the purchase sagas (and Solana) on the first purchase action */
export default function sagas() {
  return [
    lazySagas({
      pattern: [startPurchaseContentFlow.type, eagerCreateUserBank.type],
      load: () => import('./sagas')
    })
  ]
}
