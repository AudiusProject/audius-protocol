import { createCustomAction } from 'typesafe-actions'

export const SET_NOTIFICATION = 'NOTIFICATION_USERS_PAGE/SET_NOTIFICATION'
export const GET_NOTIFICATION_ERROR =
  'NOTIFICATION_USERS_PAGE/GET_NOTIFICATION_ERROR'

export const setNotification = createCustomAction(
  SET_NOTIFICATION,
  (notification: any) => ({ notification })
)
