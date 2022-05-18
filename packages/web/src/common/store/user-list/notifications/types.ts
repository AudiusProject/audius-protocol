import { UserListStoreState } from 'common/store/user-list/types'

export const USER_LIST_TAG = 'NOTIFICATION'

export type NotificationUsersPageOwnState = {
  id: string | null
}

export type NotificationUsersPageState = {
  notificationUsersPage: NotificationUsersPageOwnState
  userList: UserListStoreState
}
