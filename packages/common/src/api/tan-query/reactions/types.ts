import { ID } from '~/models/Identifiers'

export type Reaction = {
  reactedTo: string
  reactionValue: number | null
  senderUserId: ID
}

export type ReactionResponse = {
  success: boolean
  error?: string
}

export type GetReactionsArgs = {
  entityIds: string[]
}

export type WriteReactionArgs = {
  entityId: string
  reaction: ReactionTypes | null
  userId: ID
}

export type ReactionTypes = '😍' | '🔥' | '🥳' | '🤯'

// The order these reactions appear in the web + mobile UI
export const reactionOrder: ReactionTypes[] = ['😍', '🔥', '🥳', '🤯']

export const reactionsMap: { [k in ReactionTypes]: number } = {
  '😍': 1,
  '🔥': 2,
  '🥳': 3,
  '🤯': 4
}
