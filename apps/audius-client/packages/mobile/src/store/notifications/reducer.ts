import type { NotificationsActions } from './actions'
import { OPEN, CLOSE } from './actions'

export type NotificationsState = {
  isOpen: boolean
}

const initialState = {
  isOpen: false
}

const reducer = (
  state: NotificationsState = initialState,
  action: NotificationsActions
) => {
  switch (action.type) {
    case OPEN:
      return {
        ...state,
        isOpen: true
      }
    case CLOSE:
      return {
        ...state,
        isOpen: false
      }
    default:
      return state
  }
}

export default reducer
