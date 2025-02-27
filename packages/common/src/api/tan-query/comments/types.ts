import {
  CommentMention,
  GetTrackCommentsSortMethodEnum as CommentSortMethod,
  EntityManagerAction,
  EntityType
} from '@audius/sdk'

import { Comment, ID, ReplyComment } from '~/models'
import { Nullable } from '~/utils'

export type CommentOrReply = Comment | ReplyComment

export const COMMENT_ROOT_PAGE_SIZE = 15
export const COMMENT_REPLIES_PAGE_SIZE = 15

export const messages = {
  loadError: (type: 'comments' | 'replies') =>
    `There was an error loading ${type}. Please try again.`,
  mutationError: (
    actionType:
      | 'pinning'
      | 'unpinning'
      | 'deleting'
      | 'posting'
      | 'editing'
      | 'reacting to'
      | 'reporting'
  ) => `There was an error ${actionType} that comment. Please try again`,
  muteUserError: 'There was an error muting that user. Please try again.',
  updateTrackCommentNotificationSettingError:
    'There was an error updating the track comment notification setting. Please try again.',
  updateCommentNotificationSettingError:
    'There was an error updating the comment notification setting. Please try again.'
}

export type TrackCommentCount = {
  previousValue: number
  currentValue: number
}

export type PostCommentArgs = {
  userId: ID
  trackId: ID
  entityType?: EntityType
  body: string
  currentSort: CommentSortMethod
  parentCommentId?: ID
  trackTimestampS?: number
  mentions?: CommentMention[]
  newId?: ID
}

export type ReactToCommentArgs = {
  commentId: ID
  userId: ID
  isLiked: boolean
  currentSort: CommentSortMethod
  trackId: ID
  isEntityOwner?: boolean
}

export type PinCommentArgs = {
  commentId: ID
  userId: ID
  isPinned: boolean
  trackId: ID
  currentSort: CommentSortMethod
  previousPinnedCommentId?: Nullable<ID>
}

export type DeleteCommentArgs = {
  commentId: ID
  userId: ID
  trackId: ID // track id
  currentSort: CommentSortMethod
  parentCommentId?: ID
}

export type EditCommentArgs = {
  commentId: ID
  userId: ID
  newMessage: string
  mentions?: CommentMention[]
  trackId: ID
  currentSort: CommentSortMethod
  entityType?: EntityType
}

export type ReportCommentArgs = {
  commentId: ID
  parentCommentId?: ID
  userId: ID
  trackId: ID
  currentSort: CommentSortMethod
}

export type MuteUserArgs = {
  mutedUserId: ID
  userId: ID
  isMuted: boolean
  trackId?: ID
  currentSort?: CommentSortMethod
}

export type GetCommentsByTrackArgs = {
  trackId: ID
  userId: ID | null
  sortMethod: CommentSortMethod
  pageSize?: number
}

export type GetRepliesArgs = {
  commentId: ID
  currentUserId?: Nullable<ID>
  enabled?: boolean
  pageSize?: number
}

export type UpdateTrackCommentNotificationSettingArgs = {
  userId: ID
  trackId: ID
  action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
}

export type UpdateCommentNotificationSettingArgs = {
  userId: ID
  commentId: ID
  action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
}
