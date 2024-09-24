import { Comment, CommentMetadata, ReplyComment } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { getKeyFromFetchArgs } from '~/audius-query/utils'
import { useStatusChange } from '~/hooks'
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
  const { currentUserId, entityId, entityType, currentSort, setIsMutating } =
    useCurrentCommentSection()
  const [postComment, postCommentResponse] = useAQueryPostComment()
  useStatusChange(postCommentResponse.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })

  const wrappedHandler = async (
    message: string,
    parentCommentId?: string,
    trackTimestampS?: number
  ) => {
    if (currentUserId) {
      setIsMutating(true)
      postComment({
        userId: currentUserId,
        entityId,
        entityType,
        body: message,
        // @ts-ignore - TODO: the python API spec is incorrect here - this should be a string, not a number
        parentCommentId,
        trackTimestampS,
        currentSort
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
  const { currentUserId, isEntityOwner, setIsMutating } =
    useCurrentCommentSection()
  useStatusChange(reactToCommentResponse.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })
  const wrappedHandler = async (commentId: string, isLiked: boolean) => {
    if (currentUserId) {
      setIsMutating(true)
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
  const { currentUserId, setIsMutating } = useCurrentCommentSection()
  const [editComment, editCommentResponse] = useEditCommentById()
  useStatusChange(editCommentResponse.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })
  const wrappedHandler = async (commentId: string, newMessage: string) => {
    if (currentUserId) {
      setIsMutating(true)
      editComment({ id: commentId, newMessage, userId: currentUserId })
    }
  }
  return [wrappedHandler, editCommentResponse] as const
}

export const usePinComment = () => {
  const { currentUserId, setIsMutating } = useCurrentCommentSection()
  const [pinComment, pinCommentResponse] = usePinCommentById()
  useStatusChange(pinCommentResponse.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })
  const wrappedHandler = (commentId: string, isPinned: boolean) => {
    if (currentUserId) {
      setIsMutating(true)
      pinComment({ id: commentId, userId: currentUserId, isPinned })
    }
  }
  return [wrappedHandler, pinCommentResponse] as const
}

export const useReportComment = () => {
  const { currentUserId, entityId, setIsMutating } = useCurrentCommentSection()

  const [reportComment, response] = useReportCommentById()
  useStatusChange(response.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })
  const wrappedHandler = (commentId: string) => {
    if (currentUserId) {
      setIsMutating(true)
      reportComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const
}

export const useDeleteComment = () => {
  const { currentUserId, entityId, currentSort, setIsMutating } =
    useCurrentCommentSection()
  const [deleteComment, response] = useDeleteCommentById()
  useStatusChange(response.status, {
    onSuccess: () => setIsMutating(false),
    onError: () => setIsMutating(false)
  })
  const wrappedHandler = (commentId: string) => {
    if (currentUserId) {
      setIsMutating(true)
      deleteComment({
        id: commentId,
        userId: currentUserId,
        entityId,
        currentSort
      })
    }
  }
  return [wrappedHandler, response] as const
}
