import {
  EntityManagerAction,
  EntityType,
  TrackCommentsSortMethodEnum as CommentSortMethod
} from '@audius/sdk'

import { ID } from '~/models/Identifiers'

import {
  usePostComment as tqUsePostComment,
  useReactToComment as tqUseReactToComment,
  useEditComment as tqUseEditComment,
  useDeleteComment as tqUseDeleteComment,
  usePinComment as tqUsePinComment,
  useReportComment as tqUseReportComment,
  useMuteUser as tqUseMuteUser,
  useUpdateCommentNotificationSettings,
  useGetCurrentUserId
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
  // NOTE: not pulling from comment context because we reuse this method in the settings page
  const { data: currentUserId } = useGetCurrentUserId({})
  const { mutate: muteUser, ...rest } = tqUseMuteUser()
  const wrappedHandler = ({
    mutedUserId,
    isMuted,
    trackId,
    currentSort
  }: {
    mutedUserId: number
    isMuted: boolean
    trackId?: ID
    currentSort?: CommentSortMethod
  }) => {
    if (currentUserId) {
      muteUser({
        mutedUserId,
        userId: currentUserId,
        isMuted,
        trackId,
        currentSort
      })
    }
  }
  return [wrappedHandler, rest] as const
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

export const useMuteTrackCommentNotifications = (trackId: ID) => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const [updateSetting, response] = useUpdateCommentNotificationSettings()

  const wrappedHandler = (action: 'mute' | 'unmute') => {
    if (currentUserId) {
      updateSetting({
        userId: currentUserId,
        entityId: trackId,
        entityType: EntityType.TRACK,
        action:
          action === 'mute'
            ? EntityManagerAction.MUTE
            : EntityManagerAction.UNMUTE
      })
    }
  }

  return [wrappedHandler, response] as const
}

export const useMuteCommentNotifications = (commentId: ID) => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const [updateSetting, response] = useUpdateCommentNotificationSettings()

  const wrappedHandler = (action: 'mute' | 'unmute') => {
    if (currentUserId) {
      updateSetting({
        userId: currentUserId,
        entityId: commentId,
        entityType: EntityType.COMMENT,
        action:
          action === 'mute'
            ? EntityManagerAction.MUTE
            : EntityManagerAction.UNMUTE
      })
    }
  }

  return [wrappedHandler, response] as const
}
