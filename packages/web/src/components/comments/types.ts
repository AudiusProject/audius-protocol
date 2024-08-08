import { ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { EntityType } from '@audius/sdk/src/sdk/services/EntityManager/types'

// TODO: This should come from common or SDK models
type BaseComment = {
  id: ID
  userId: string
  message: string
  timestampS?: number
  reactCount: number
  isPinned: boolean
  createdAt: string
  updatedAt?: Nullable<string>
}

export type CommentReply = BaseComment & { replies: null }

export type Comment = BaseComment & {
  // replies null on the inside type since replies dont have additional replies
  replies: Nullable<CommentReply[]>
}

export type CommentSectionProps = {
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType
}
