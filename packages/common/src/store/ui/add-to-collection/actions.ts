import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models/Identifiers'

export const REQUEST_OPEN = 'ADD_TO_COLLECTION/REQUEST_OPEN'
export const OPEN = 'ADD_TO_COLLECTION/OPEN'
export const CLOSE = 'ADD_TO_COLLECTION/CLOSE'

export const requestOpen = createCustomAction(
  REQUEST_OPEN,
  (
    collectionType: 'album' | 'playlist',
    trackId: ID,
    trackTitle: string,
    isUnlisted?: boolean
  ) => ({
    collectionType,
    trackId,
    trackTitle,
    isUnlisted
  })
)
export const open = createCustomAction(
  OPEN,
  (
    collectionType: 'album' | 'playlist',
    trackId: ID,
    trackTitle: string,
    isUnlisted?: boolean
  ) => ({
    collectionType,
    trackId,
    trackTitle,
    isUnlisted
  })
)
export const close = createCustomAction(CLOSE, () => {})
