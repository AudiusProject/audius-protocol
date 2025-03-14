import { FollowNotification } from '~/store/notifications'

export type NotificationUsersPageState = {
  notification: FollowNotification | null
}

export const NOTIFICATIONS_USER_LIST_TAG = 'NOTIFICATION'
