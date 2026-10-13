import { lazySagas } from '~/utils/lazySagas'

import { beginWithdrawUSDC } from './slice'

/** Loads the withdraw sagas (and Solana) on the first withdrawal */
export default function sagas() {
  return [
    lazySagas({
      pattern: [beginWithdrawUSDC.type],
      load: () => import('./sagas')
    })
  ]
}
