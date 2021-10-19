import { receive } from '../../store/clientStore/slice'
import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.SYNC_CLIENT_STORE]: ({ message, dispatch }) => {
    dispatch(receive(message.state))
  }
}
