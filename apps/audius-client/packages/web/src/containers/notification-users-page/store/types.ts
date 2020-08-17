import { UserListStoreState } from 'containers/user-list/store/types'

export type NotificationUsersPageOwnState = {
  id: string | null
}

export type NotificationUsersPageState = {
  notificationUsersPage: NotificationUsersPageOwnState
  userList: UserListStoreState
}
