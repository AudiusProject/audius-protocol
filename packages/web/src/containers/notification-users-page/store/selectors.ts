import { formatCount } from 'common/utils/formatUtil'
import { getNotificationById } from 'containers/notification/store/selectors'
import { NotificationType } from 'containers/notification/store/types'
import { AppState } from 'store/types'

export const getId = (state: AppState) =>
  state.application.pages.notificationUsers.notificationUsersPage.id
export const getUserList = (state: AppState) =>
  state.application.pages.notificationUsers.userList
export const getUserIds = (state: AppState) =>
  state.application.pages.notificationUsers.userList.userIds

const defaultTitle = 'Users'
export const getPageTitle = (state: AppState) => {
  const notificationId = getId(state)
  if (!notificationId) return defaultTitle
  const notification = getNotificationById(state, notificationId)
  if (!notification || !('userIds' in notification)) return defaultTitle
  const count = notification.userIds.length
  if (notification.type === NotificationType.Follow)
    return `${formatCount(count)} New Followers`
  return `${formatCount(count)} ${notification.type.toLowerCase()}s`
}
