import { UserListStoreState } from 'common/store/user-list/types'

export type NotificationUsersPageOwnState = {
  id: string | null
}

export type NotificationUsersPageState = {
  notificationUsersPage: NotificationUsersPageOwnState
  userList: UserListStoreState
}
