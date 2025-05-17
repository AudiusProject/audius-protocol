import { QUERY_KEYS } from '../queryKeys'
import { QueryKey } from '../types'

import { ReactionTypes, reactionsMap, Reaction } from './types'

export const getReactionsQueryKey = (entityIds: string[]) =>
  [QUERY_KEYS.reactions, entityIds] as unknown as QueryKey<
    Record<string, Reaction>
  >

export const getEntityReactionQueryKey = (entityId: string) =>
  [QUERY_KEYS.entityReaction, entityId] as unknown as QueryKey<Reaction | null>

export const getReactionFromRawValue = (
  value: number | null
): ReactionTypes | null => {
  if (value === null) return null
  const val = (Object.entries(reactionsMap) as [ReactionTypes, number][]).find(
    ([_k, v]) => v === value
  )
  return val?.[0] ?? null
}

export const getRawValueFromReaction = (
  reaction: ReactionTypes | null
): number | null => {
  if (reaction === null) return null
  return reactionsMap[reaction] ?? null
}
