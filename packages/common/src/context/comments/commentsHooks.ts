import { CommentMetadata } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { getKeyFromFetchArgs } from '~/audius-query/utils'
import { Comment, ReplyComment } from '~/models/Comment'
import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store'

import {
  usePostComment as tqUsePostComment,
  useReactToComment as tqUseReactToComment,
  useEditComment as tqUseEditComment,
  useDeleteComment as tqUseDeleteComment,
  usePinComment as tqUsePinComment,
  useReportComment as tqUseReportComment
} from '../../api'

import { useCurrentCommentSection } from './commentsContext'

export const usePostComment = () => {
  const { currentUserId, entityId, entityType, currentSort } =
    useCurrentCommentSection()
  const { mutate: postComment, ...rest } = tqUsePostComment()

  const wrappedHandler = async (
    message: string,
    parentCommentId?: ID,
    trackTimestampS?: number,
    mentions?: ID[]
  ) => {
    if (currentUserId) {
      postComment({
        userId: currentUserId,
        trackId: entityId,
        entityType,
        body: message,
        parentCommentId,
        trackTimestampS,
        mentions,
        currentSort
      })
    }
  }

  return [wrappedHandler, rest] as const
}

export const useReactToComment = () => {
  const { currentUserId, isEntityOwner, currentSort, entityId } =
    useCurrentCommentSection()
  const { mutate: reactToComment, ...response } = tqUseReactToComment()

  const wrappedHandler = async (commentId: ID, isLiked: boolean) => {
    if (currentUserId) {
      reactToComment({
        commentId,
        userId: currentUserId,
        isLiked,
        isEntityOwner,
        currentSort,
        trackId: entityId
      })
    }
  }
  return [wrappedHandler, response] as const
}

export const useEditComment = () => {
  const { currentUserId, currentSort, entityId } = useCurrentCommentSection()
  const { mutate: editComment, ...rest } = tqUseEditComment()
  const wrappedHandler = async (
    commentId: ID,
    newMessage: string,
    mentions?: ID[]
  ) => {
    if (currentUserId) {
      editComment({
        commentId,
        newMessage,
        userId: currentUserId,
        mentions,
        trackId: entityId,
        currentSort
      })
    }
  }
  return [wrappedHandler, rest] as const
}

export const usePinComment = () => {
  const { currentUserId, entityId, currentSort } = useCurrentCommentSection()
  const { mutate: pinComment, ...rest } = tqUsePinComment()
  const wrappedHandler = (commentId: ID, isPinned: boolean) => {
    if (currentUserId) {
      pinComment({
        commentId,
        userId: currentUserId,
        trackId: entityId,
        isPinned,
        currentSort
      })
    }
  }
  return [wrappedHandler, rest] as const
}

export const useReportComment = () => {
  const { currentUserId, entityId, currentSort } = useCurrentCommentSection()
  const { mutate: reportComment, ...rest } = tqUseReportComment()
  const wrappedHandler = (commentId: ID) => {
    if (currentUserId) {
      reportComment({
        commentId,
        userId: currentUserId,
        trackId: entityId,
        currentSort
      })
    }
  }
  return [wrappedHandler, rest] as const
}

export const useMuteUser = () => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const [muteUser, response] = useMuteUserById()
  const wrappedHandler = ({
    mutedUserId,
    isMuted,
    entityId
  }: {
    mutedUserId: number
    isMuted: boolean
    entityId?: number
  }) => {
    if (currentUserId) {
      muteUser({
        mutedUserId,
        userId: currentUserId,
        isMuted,
        entityId
      })
    }
  }
  return [wrappedHandler, response] as const
}

export const useDeleteComment = () => {
  const { currentUserId, entityId, currentSort } = useCurrentCommentSection()
  const { mutate: deleteComment, ...rest } = tqUseDeleteComment()

  const wrappedHandler = (commentId: ID) => {
    if (currentUserId) {
      deleteComment({
        commentId,
        userId: currentUserId,
        trackId: entityId,
        currentSort
      })
    }
  }
  return [wrappedHandler, rest] as const
}
