import { EntityType } from '../../services/EntityManager/types'

export type CommentMetadata = {
  body?: string
  commentId?: number // In our client we create the ID and pass it in. But this is optional for SDK devs (if not provided SDK will pick one)
  userId: number
  entityId: number
  entityType?: EntityType // For now just tracks are supported, but we left the door open for more
  parentCommentId?: number
  timestamp_s?: number
}
