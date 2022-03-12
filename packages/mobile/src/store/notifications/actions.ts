export const OPEN = 'NOTIFICATIONS/OPEN'
export const CLOSE = 'NOTIFICATIONS/CLOSE'

type OpenAction = {
  type: typeof OPEN
}

type CloseAction = {
  type: typeof CLOSE
}

export type NotificationsActions = OpenAction | CloseAction

export const open = (): OpenAction => ({
  type: OPEN
})

export const close = (): CloseAction => ({
  type: CLOSE
})
