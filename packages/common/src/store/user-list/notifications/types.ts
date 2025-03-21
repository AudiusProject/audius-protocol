import { UserListStoreState } from '~/store/user-list/types'

export const NOTIFICATIONS_USER_LIST_TAG = 'NOTIFICATION'

export type NotificationUsersPageOwnState = {
  notification: any | null
}

export type NotificationUsersPageState = {
  notificationUsersPage: NotificationUsersPageOwnState
  userList: UserListStoreState
}
