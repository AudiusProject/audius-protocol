import * as webActions from '../../store/web/actions'
import share from '../../utils/share'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.ENABLE_PULL_TO_REFRESH]: ({ message, dispatch }) => {
    dispatch(webActions.enablePullToRefresh(message))
  },
  [MessageType.DISABLE_PULL_TO_REFRESH]: ({ message, dispatch }) => {
    dispatch(webActions.disablePullToRefresh(message))
  },
  [MessageType.SHARE]: async ({ message }) => {
    await share({
      message: message.message,
      url: message.url
    })
  }
}
