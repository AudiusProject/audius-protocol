import { getAccountUser } from '~/store/account/selectors'
import { getUser, getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

import { Entity, Notification, NotificationType, Achievement } from './types'

export const getNotificationUser = (
  state: CommonState,
  notification: Notification
) => {
  if (
    notification.type === NotificationType.TierChange ||
    (notification.type === NotificationType.Milestone &&
      notification.achievement === Achievement.Followers)
  ) {
    return getAccountUser(state)
  } else if ('userId' in notification) {
    return getUser(state, { id: notification.userId })
  } else if (
    'entityId' in notification &&
    'entityType' in notification &&
    notification.entityType === Entity.User
  ) {
    return getUser(state, { id: notification.entityId })
  } else {
    return null
  }
}

export const getNotificationUsers = (
  state: CommonState,
  notification: Notification,
  limit: number
) => {
  if ('userIds' in notification) {
    const userIds = notification.userIds.slice(0, limit)
    const userMap = getUsers(state, { ids: userIds })
    return userIds.map((id) => userMap[id].metadata)
  }
  return null
}
