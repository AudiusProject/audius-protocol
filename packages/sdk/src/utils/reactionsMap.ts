export const reactionsMap = {
  '😍': 1,
  '🔥': 2,
  '🥳': 3,
  '🤯': 4
} as const

type ReactionTypes = keyof typeof reactionsMap

/** use overloads to be able to use same function with the two different types */
export function getReaction(reaction: number): ReactionTypes | undefined
export function getReaction(reaction: ReactionTypes): number | undefined
export function getReaction(
  reaction: number | ReactionTypes
): ReactionTypes | number | undefined {
  if (typeof reaction === 'number') {
    return Object.keys(reactionsMap).find(
      (key) => reactionsMap[key as ReactionTypes] === reaction
    ) as ReactionTypes | undefined
  }
  return reactionsMap[reaction]
}
