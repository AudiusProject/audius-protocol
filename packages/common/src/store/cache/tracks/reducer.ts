import { merge } from 'lodash'

import { Cache } from '~/models/Cache'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { Track } from '~/models/Track'
import { initialCacheState } from '~/store/cache/reducer'

import { Entry } from '../types'

import { TracksCacheState } from './types'

const initialState: TracksCacheState = {
  ...(initialCacheState as unknown as Cache<Track>),
  permalinks: {}
}

const actionsMap = {}

// TODO: delete this reducer entirely
const reducer = (
  state: TracksCacheState = initialState,
  action: any,
  kind: Kind
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action, kind)
}

export default reducer
