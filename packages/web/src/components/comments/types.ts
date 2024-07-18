import { ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { EntityType } from '@audius/sdk/src/sdk/services/EntityManager/types'

// TODO: This should come from common or SDK models
type BaseComment = {
  id: ID
  userId: ID
  message: string
  timestamp_s?: number
  react_count: number
  is_pinned: boolean
  created_at: Date
  updated_at?: Nullable<Date>
}

type CommentWithReplies<T extends BaseComment> = T & { replies: Nullable<T[]> }

export type Comment = BaseComment & {
  replies: Nullable<CommentWithReplies<BaseComment>[]>
}

export type CommentSectionProps = {
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType
}
