import { createCustomAction } from 'typesafe-actions'

import { Collectible, ID } from 'models'

export const ETH_COLLECTIBLES_FETCHED = 'COLLECTIBLES/ETH_COLLECTIBLES_FETCHED'
export const SOL_COLLECTIBLES_FETCHED = 'COLLECTIBLES/SOL_COLLECTIBLES_FETCHED'
export const UPDATE_USER_COLLECTIBLES =
  'COLLECTIBLES/UPDATE_USER_COLLECTIBLES'

export const ethCollectiblesFetched = createCustomAction(
  ETH_COLLECTIBLES_FETCHED,
  (userId: ID) => ({ userId })
)
export const solCollectiblesFetched = createCustomAction(
  SOL_COLLECTIBLES_FETCHED,
  (userId: ID) => ({ userId })
)
export const updateUserCollectibles = createCustomAction(
  UPDATE_USER_COLLECTIBLES,
  (userId: ID, userCollectibles: Collectible[]) => ({ userId, userCollectibles })
)
