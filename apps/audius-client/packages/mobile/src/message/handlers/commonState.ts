import { receive } from 'app/store/common/actions'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.SYNC_COMMON_STATE]: ({ message, dispatch }) => {
    dispatch(receive(message.state))
  }
}
