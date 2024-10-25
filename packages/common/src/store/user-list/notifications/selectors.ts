import { CommonState } from '~/store/commonStore'
import { getNotificationById } from '~/store/notifications/selectors'
import { NotificationType } from '~/store/notifications/types'
import { formatCount } from '~/utils/formatUtil'

const getBaseState = (state: CommonState) => state.ui.userList.notifications

export const getId = (state: CommonState) =>
  getBaseState(state).notificationUsersPage.id
export const getUserList = (state: CommonState) => getBaseState(state).userList
export const getUserIds = (state: CommonState) =>
  getBaseState(state).userList.userIds

const defaultTitle = 'Users'
export const getPageTitle = (state: CommonState) => {
  const notificationId = getId(state)
  if (!notificationId) return defaultTitle
  const notification = getNotificationById(state, notificationId)
  if (!notification || !('userIds' in notification)) return defaultTitle
  const count = notification.userIds.length
  if (notification.type === NotificationType.Follow)
    return `${formatCount(count)} New Followers`
  if (
    notification.type === NotificationType.Comment ||
    notification.type === NotificationType.CommentThread ||
    notification.type === NotificationType.CommentMention ||
    notification.type === NotificationType.CommentReaction
  )
    return `${formatCount(count)} Commenters`
  return `${formatCount(count)} ${notification.type.toLowerCase()}s`
}
