import { reachabilitySelectors } from '@audius/common'
import queue from 'react-native-job-queue'

import { store } from 'app/store'

const getIsReachable = reachabilitySelectors.getIsReachable

export const startQueueIfOnline = async () => {
  const state = store.getState()
  const reachable = getIsReachable(state)
  if (reachable) {
    return queue.start()
  }
}
