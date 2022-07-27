import * as webActions from 'app/store/web/actions'
import share from 'app/utils/share'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

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
