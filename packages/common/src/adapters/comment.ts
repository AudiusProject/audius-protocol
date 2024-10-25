import {
  Comment as CommentSDK,
  ReplyComment as ReplyCommentSDK
} from '@audius/sdk'

import { Comment, ReplyComment } from '~/models/Comment'
import { decodeHashId } from '~/utils/hashIds'

import { transformAndCleanList } from './utils'

export const commentFromSDK = (input: CommentSDK): Comment | undefined => {
  const { id, userId, replies, ...rest } = input
  const decodedId = decodeHashId(id)
  const decodedUserId = decodeHashId(userId)

  if (!decodedId) {
    return undefined
  }

  return {
    ...rest,
    id: decodedId,
    userId:
      userId === undefined || decodedUserId === null
        ? undefined
        : decodedUserId, // Note: comments can have no user id when they're a tombstone state (deleted but has replies)
    replies: transformAndCleanList(replies, replyCommentFromSDK)
  }
}

export const replyCommentFromSDK = (
  input: ReplyCommentSDK
): ReplyComment | undefined => {
  const { id, userId, ...rest } = input
  const decodedId = decodeHashId(id)
  const decodedUserId = decodeHashId(userId)

  if (!decodedId || !decodedUserId) {
    return undefined
  }

  return {
    ...rest,
    id: decodedId,
    userId: decodedUserId
  }
}
