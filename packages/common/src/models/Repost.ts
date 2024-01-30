import { ID } from 'models/Identifiers'

import { User } from './User'

export type Repost = {
  repost_item_id: number
  repost_type: string
  user_id: ID
}

export type FolloweeRepost = Repost & User
export type UserFollowees = {
  id: ID
  metadata: { _followees: FolloweeRepost[] }
}
