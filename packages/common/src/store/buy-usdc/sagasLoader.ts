import { lazySagas } from '~/utils/lazySagas'

import { onrampOpened, startRecoveryIfNecessary } from './slice'

/**
 * Loads the buy USDC sagas outside of the boot bundle. Loaded eagerly
 * because they run a purchase recovery check on page load.
 */
export default function sagas() {
  return [
    lazySagas({
      pattern: [onrampOpened.type, startRecoveryIfNecessary.type],
      load: () => import('./sagas'),
      eager: true
    })
  ]
}
