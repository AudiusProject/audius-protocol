import { CommentMetadata } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { getKeyFromFetchArgs } from '~/audius-query/utils'
import { Comment, ReplyComment } from '~/models/Comment'
import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store'

import {
  useDeleteCommentById,
  useEditCommentById,
  usePinCommentById,
  usePostComment as useAQueryPostComment,
  useReactToCommentById,
  useReportCommentById
} from '../../api'

import { useCurrentCommentSection } from './commentsContext'

export const usePostComment = () => {
  const { currentUserId, entityId, entityType } = useCurrentCommentSection()
  const [postComment, postCommentResponse] = useAQueryPostComment()

  const wrappedHandler = async (
    message: string,
    parentCommentId?: ID,
    trackTimestampS?: number
  ) => {
    if (currentUserId) {
      postComment({
        userId: currentUserId,
        entityId,
        entityType,
        body: message,
        parentCommentId,
        trackTimestampS
      })
    }
  }

  return [wrappedHandler, postCommentResponse] as const
}

/**
 * Returns the status of a specific comment post - without having to have bound the hook
 * The status returned from usePostComment above is scoped to where the handler is called;
 * this status is just based on what comment you're looking for
 */
export const useCommentPostStatus = (comment: Comment | ReplyComment) => {
  const { entityId, entityType } = useCurrentCommentSection()
  const { message, trackTimestampS, userId } = comment
  const parentCommentId =
    'parentCommentId' in comment ? comment.parentCommentId : undefined

  return useSelector(
    (state: CommonState) =>
      state.api.commentsApi.postComment[
        getKeyFromFetchArgs({
          body: message,
          userId: Number(userId),
          entityId,
          entityType,
          parentCommentId,
          trackTimestampS
        } as CommentMetadata)
      ]?.status
  )
}

export const useReactToComment = () => {
  const [reactToComment, reactToCommentResponse] = useReactToCommentById()
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()
  const wrappedHandler = async (commentId: ID, isLiked: boolean) => {
    if (currentUserId) {
      reactToComment({
        id: commentId,
        userId: currentUserId,
        isLiked,
        isEntityOwner
      })
    }
  }
  return [wrappedHandler, reactToCommentResponse] as const
}

export const useEditComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [editComment, editCommentResponse] = useEditCommentById()
  const wrappedHandler = async (commentId: ID, newMessage: string) => {
    if (currentUserId) {
      editComment({ id: commentId, newMessage, userId: currentUserId })
    }
  }
  return [wrappedHandler, editCommentResponse] as const
}

export const usePinComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [pinComment, pinCommentResponse] = usePinCommentById()
  const wrappedHandler = (commentId: ID, isPinned: boolean) => {
    if (currentUserId) {
      pinComment({ id: commentId, userId: currentUserId, isPinned })
    }
  }
  return [wrappedHandler, pinCommentResponse] as const
}

export const useReportComment = () => {
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [reportComment, response] = useReportCommentById()
  const wrappedHandler = (commentId: ID) => {
    if (currentUserId) {
      reportComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const
}

export const useDeleteComment = () => {
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [deleteComment, response] = useDeleteCommentById()

  const wrappedHandler = (commentId: ID) => {
    if (currentUserId) {
      deleteComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const
}
