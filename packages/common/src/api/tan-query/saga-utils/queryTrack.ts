import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'

import { TQTrack } from '../models'
import { getTrackQueryKey } from '../useTrack'

export function* queryTrack(id: ID) {
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData<TQTrack>(getTrackQueryKey(id))
}
