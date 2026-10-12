import { lazySagas } from '~/utils/lazySagas'

import { onrampOpened, startRecoveryIfNecessary } from './slice'

/** Loads the buy USDC sagas when an onramp or USDC recovery starts */
export default function sagas() {
  return [
    lazySagas({
      pattern: [onrampOpened.type, startRecoveryIfNecessary.type],
      load: () => import('./sagas')
    })
  ]
}
