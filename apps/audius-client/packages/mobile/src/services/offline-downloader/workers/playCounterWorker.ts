import { tracksSocialActions } from '@audius/common'
import { Worker } from 'react-native-job-queue'

import { store } from 'app/store'

const { recordListen } = tracksSocialActions

export const PLAY_COUNTER_WORKER = 'play_counter_worker'

export type PlayCountWorkerPayload = { trackId: number }

const countPlay = async (payload: PlayCountWorkerPayload) => {
  const { trackId } = payload
  store.dispatch(recordListen(trackId))
}

export const playCounterWorker = new Worker(PLAY_COUNTER_WORKER, countPlay)
