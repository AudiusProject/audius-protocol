import { createCustomAction } from 'typesafe-actions'

export const SET_NOTIFICATION_ID = 'NOTIFICATION_USERS_PAGE/SET_NOTIFICATION_ID'

export const setNotificationId = createCustomAction(
  SET_NOTIFICATION_ID,
  (id: string) => ({ id })
)
