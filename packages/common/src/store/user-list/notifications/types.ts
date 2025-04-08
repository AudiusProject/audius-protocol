import {
  CommentMentionNotification,
  CommentNotification,
  CommentReactionNotification,
  CommentThreadNotification,
  FavoriteNotification,
  FollowNotification,
  RepostNotification
} from '~/store/notifications'

export type NotificationUsersPageState = {
  notification:
    | FollowNotification
    | FavoriteNotification
    | RepostNotification
    | CommentNotification
    | CommentThreadNotification
    | CommentMentionNotification
    | CommentReactionNotification
    | null
}

export const NOTIFICATIONS_USER_LIST_TAG = 'NOTIFICATION'
