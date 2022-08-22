export type ReactionTypes = 'heart' | 'fire' | 'party' | 'explode'

// The order these reactions appear in the web + mobile UI
export const reactionOrder: ReactionTypes[] = [
  'heart',
  'fire',
  'party',
  'explode'
]

export const reactionsMap: { [k in ReactionTypes]: number } = {
  heart: 1,
  fire: 2,
  party: 3,
  explode: 4
}
