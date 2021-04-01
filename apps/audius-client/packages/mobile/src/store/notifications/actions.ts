import { Notification } from './types'
import { Status } from 'types/status'

export const OPEN = 'NOTIFICATIONS/OPEN'
export const CLOSE = 'NOTIFICATIONS/CLOSE'
export const APPEND = 'NOTIFICATIONS/APPEND'
export const REPLACE = 'NOTIFICATIONS/REPLACE'
export const MARK_AS_VIEWED = 'NOTIFICATIONS/MARK_AS_VIEWED'
export const SET_STATUS = 'NOTIFICATIONS/SET_STATUS'

type OpenAction = {
  type: typeof OPEN
}

type CloseAction = {
  type: typeof CLOSE
}

type AppendAction = {
  type: typeof APPEND
  status: Status
  notifications: Notification[]
}

type ReplaceAction = {
  type: typeof REPLACE
  status: Status
  notifications: Notification[]
}

type MarkAsViewedAction = {
  type: typeof MARK_AS_VIEWED
}

type SetStatusAction = {
  type: typeof SET_STATUS
  status: Status
}

export type NotificationsActions =
  | OpenAction
  | CloseAction
  | AppendAction
  | ReplaceAction
  | MarkAsViewedAction
  | SetStatusAction

export const open = (): OpenAction => ({
  type: OPEN
})

export const close = (): CloseAction => ({
  type: CLOSE
})

export const append = (
  status: Status,
  notifications: Notification[]
): AppendAction => ({
  type: APPEND,
  status,
  notifications
})

export const replace = (
  status: Status,
  notifications: Notification[]
): ReplaceAction => ({
  type: REPLACE,
  status,
  notifications
})

export const markAsViewed = (): MarkAsViewedAction => ({
  type: MARK_AS_VIEWED
})

export const setStatus = (status: Status): SetStatusAction => ({
  type: SET_STATUS,
  status
})
