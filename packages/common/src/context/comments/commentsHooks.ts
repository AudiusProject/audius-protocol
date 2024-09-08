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
    parentCommentId?: string,
    trackTimestampS?: number
  ) => {
    if (currentUserId) {
      postComment({
        userId: currentUserId,
        entityId,
        entityType,
        body: message,
        // @ts-ignore - TODO: the python API spec is incorrect here - this should be a string, not a number
        parentCommentId,
        trackTimestampS
      })
    }
  }
  return [wrappedHandler, postCommentResponse] as const
}

export const useReactToComment = () => {
  const [reactToComment, reactToCommentResponse] = useReactToCommentById()
  const { currentUserId } = useCurrentCommentSection()
  const wrappedHandler = async (commentId: string, isLiked: boolean) => {
    if (currentUserId) {
      reactToComment({ id: commentId, userId: currentUserId, isLiked })
    }
    // TODO: trigger auth flow here
  }
  return [wrappedHandler, reactToCommentResponse] as const
}

export const useEditComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [editComment, editCommentResponse] = useEditCommentById()
  const wrappedHandler = async (commentId: string, newMessage: string) => {
    if (currentUserId) {
      editComment({ id: commentId, newMessage, userId: currentUserId })
    }
  }
  return [wrappedHandler, editCommentResponse] as const
}

export const usePinComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [pinComment, pinCommentResponse] = usePinCommentById()
  const wrappedHandler = (commentId: string, isPinned: boolean) => {
    if (currentUserId) {
      pinComment({ id: commentId, userId: currentUserId, isPinned })
    }
  }
  return [wrappedHandler, pinCommentResponse] as const
}

export const useReportComment = () => {
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [reportComment, response] = useReportCommentById()
  const wrappedHandler = (commentId: string) => {
    if (currentUserId) {
      reportComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const
}

export const useDeleteComment = () => {
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [deleteComment, response] = useDeleteCommentById()

  const wrappedHandler = (commentId: string) => {
    if (currentUserId) {
      deleteComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const
}
