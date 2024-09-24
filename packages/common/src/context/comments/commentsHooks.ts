import { Comment, CommentMetadata, ReplyComment } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { getKeyFromFetchArgs } from '~/audius-query/utils'
import { CommonState } from '~/store'
import { decodeHashId } from '~/utils/hashIds'

import {
  useDeleteCommentById,
  useEditCommentById,
  usePinCommentById,
  usePostComment as useAQueryPostComment,
  useReactToCommentById,
  useReportCommentById,
  useMuteUserById,
  useGetCurrentUserId
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
  const wrappedHandler = async (commentId: string, isLiked: boolean) => {
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

export const useMuteUser = () => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const [muteUser, response] = useMuteUserById()
  const wrappedHandler = ({
    mutedUserId,
    isMuted,
    entityId
  }: {
    mutedUserId: string
    isMuted: boolean
    entityId?: number
  }) => {
    if (currentUserId) {
      muteUser({
        mutedUserId: Number(mutedUserId),
        userId: currentUserId,
        isMuted,
        entityId
      })
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
