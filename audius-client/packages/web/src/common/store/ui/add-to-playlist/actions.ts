import { ID } from '@audius/common'
import { createCustomAction } from 'typesafe-actions'

export const REQUEST_OPEN = 'ADD_TO_PLAYLIST/REQUEST_OPEN'
export const OPEN = 'ADD_TO_PLAYLIST/OPEN'
export const CLOSE = 'ADD_TO_PLAYLIST/CLOSE'

export const requestOpen = createCustomAction(
  REQUEST_OPEN,
  (trackId: ID, trackTitle: string) => ({ trackId, trackTitle })
)
export const open = createCustomAction(
  OPEN,
  (trackId: ID, trackTitle: string) => ({ trackId, trackTitle })
)
export const close = createCustomAction(CLOSE, () => {})
