import {
  Comment as CommentSDK,
  HashId,
  ReplyComment as ReplyCommentSDK
} from '@audius/sdk'

import { Comment, ReplyComment } from '~/models/Comment'

import { transformAndCleanList } from './utils'

export const commentFromSDK = (input: CommentSDK): Comment | undefined => {
  const { id, userId, replies, ...rest } = input
  const decodedId = HashId.parse(id)
  const decodedUserId = HashId.parse(userId)

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
  const decodedId = HashId.parse(id)
  const decodedUserId = HashId.parse(userId)

  if (!decodedId || !decodedUserId) {
    return undefined
  }

  return {
    ...rest,
    id: decodedId,
    userId: decodedUserId
  }
}
