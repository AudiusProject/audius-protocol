import { createCustomAction } from 'typesafe-actions'

export const SET_NOTIFICATION_ID = 'NOTIFICATION_USERS_PAGE/SET_NOTIFICATION_ID'
export const GET_NOTIFICATION_ERROR =
  'NOTIFICATION_USERS_PAGE/GET_NOTIFICATION_ERROR'

export const setNotificationId = createCustomAction(
  SET_NOTIFICATION_ID,
  (id: string) => ({ id })
)

export const getNotificationError = createCustomAction(
  GET_NOTIFICATION_ERROR,
  (id: string, error: string) => ({ id, error })
)
