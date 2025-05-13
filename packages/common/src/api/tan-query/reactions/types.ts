import { ID } from '~/models/Identifiers'
import { ReactionTypes } from '~/store/ui/reactions/types'

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

export { messages } from './messages'
