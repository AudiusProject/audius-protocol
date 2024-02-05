import type { ID } from '@audius/common/models'
import { tracksSocialActions } from '@audius/common/store'
import { put } from 'typed-redux-saga'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { completePlayCount, requestProcessNextJob } from '../../../slice'

const { recordListen } = tracksSocialActions

export function* playCounterWorker(trackId: ID) {
  track(make({ eventName: EventNames.OFFLINE_MODE_PLAY, trackId }))
  yield* put(recordListen(trackId))
  yield* put(completePlayCount())
  yield* put(requestProcessNextJob())
}
