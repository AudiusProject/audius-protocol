import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models/Identifiers'

export const REQUEST_OPEN = 'ADD_TO_PLAYLIST/REQUEST_OPEN'
export const OPEN = 'ADD_TO_PLAYLIST/OPEN'
export const CLOSE = 'ADD_TO_PLAYLIST/CLOSE'

export const requestOpen = createCustomAction(
  REQUEST_OPEN,
  (trackId: ID, trackTitle: string, isUnlisted?: boolean) => ({
    trackId,
    trackTitle,
    isUnlisted
  })
)
export const open = createCustomAction(
  OPEN,
  (trackId: ID, trackTitle: string, isUnlisted?: boolean) => ({
    trackId,
    trackTitle,
    isUnlisted
  })
)
export const close = createCustomAction(CLOSE, () => {})
