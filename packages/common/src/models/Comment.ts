import {
  Comment as CommentSDK,
  ReplyComment as ReplyCommentSDK
} from '@audius/sdk'
import type { OverrideProperties } from 'type-fest'

import { Maybe } from '~/utils/typeUtils'

import { ID } from './Identifiers'

export type ReplyComment = OverrideProperties<
  ReplyCommentSDK,
  { id: ID; userId: ID }
>

export type Comment = OverrideProperties<
  CommentSDK,
  { id: ID; userId: ID; replies: Maybe<ReplyComment[]> }
>
