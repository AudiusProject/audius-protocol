import { EntityType } from '../../services/EntityManager/types'

export type CommentMetadata = {
  body?: string
  userId: number
  entityId: number
  entityType?: EntityType // For now just tracks are supported, but we left the door open for more
  parentCommentId?: number
  timestamp_s?: number
}
