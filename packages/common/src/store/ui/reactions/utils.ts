import { reactionsMap, ReactionTypes } from './types'

export const getReactionFromRawValue = (value: number) => {
  const val = (Object.entries(reactionsMap) as [ReactionTypes, number][]).find(
    ([_k, v]) => v === value
  )
  return val?.[0] ?? null
}
