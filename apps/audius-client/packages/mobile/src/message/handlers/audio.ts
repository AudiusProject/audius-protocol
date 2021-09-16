import * as audioActions from '../../store/audio/actions'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.PLAY_TRACK]: ({ dispatch }) => {
    dispatch(audioActions.play())
  },
  [MessageType.PAUSE_TRACK]: ({ dispatch }) => {
    dispatch(audioActions.pause())
  },
  [MessageType.SEEK_TRACK]: ({ message, dispatch }) => {
    dispatch(audioActions.seek(message))
  },
  [MessageType.GET_POSITION]: ({ message, postMessage }) => {
    postMessage({
      type: message.type,
      id: message.id,
      // @ts-ignore
      ...global.progress
    })
  },
  [MessageType.PERSIST_QUEUE]: ({ message, dispatch }) => {
    dispatch(audioActions.persistQueue(message))
  },
  [MessageType.SET_REPEAT_MODE]: ({ message, dispatch }) => {
    dispatch(audioActions.repeat(message))
  },
  [MessageType.SHUFFLE]: ({ message, dispatch }) => {
    dispatch(audioActions.shuffle(message))
  }
}
