import { Message } from 'src/message'

export const PLAY = 'AUDIO/PLAY'
export const PAUSE = 'AUDIO/PAUSE'
export const NEXT = 'AUDIO/NEXT'
export const PREVIOUS = 'AUDIO/PREVIOUS'
export const SEEK = 'AUDIO/SEEK'
export const SET_INFO = 'AUDIO/SET_INFO'
export const PERSIST_QUEUE = 'AUDIO/PERSIST_QUEUE'
export const REPEAT = 'AUDIO/REPEAT'
export const SHUFFLE = 'AUDIO/SHUFFLE'
export const RESET = 'AUDIO/RESET'

type PlayAction = {
  type: typeof PLAY
}

type PauseAction = {
  type: typeof PAUSE
}

type NextAction = {
  type: typeof NEXT
}

type PreviousAction = {
  type: typeof PREVIOUS
}

type SeekAction = {
  type: typeof SEEK
  message: Message
}

type SetInfoAction = {
  type: typeof SET_INFO
  message: Message
}

type PersistQueueAction = {
  type: typeof PERSIST_QUEUE
  message: Message
}

type RepeatAction = {
  type: typeof REPEAT
  message: Message
}

type ShuffleAction = {
  type: typeof SHUFFLE
  message: Message
}

type ResetAction = {
  type: typeof RESET
}

export type AudioActions =
  | PlayAction
  | PauseAction
  | NextAction
  | PreviousAction
  | SeekAction
  | SetInfoAction
  | PersistQueueAction
  | RepeatAction
  | ShuffleAction
  | ResetAction

export const play = (): PlayAction => ({
  type: PLAY
})

export const pause = (): PauseAction => ({
  type: PAUSE
})

export const next = (): NextAction => ({
  type: NEXT
})

export const previous = (): PreviousAction => ({
  type: PREVIOUS
})

export const seek = (message: Message): SeekAction => ({
  type: SEEK,
  message
})

export const setInfo = (message: Message): SetInfoAction => ({
  type: SET_INFO,
  message
})

export const persistQueue = (message: Message): PersistQueueAction => ({
  type: PERSIST_QUEUE,
  message
})

export const repeat = (message: Message): RepeatAction => ({
  type: REPEAT,
  message
})

export const shuffle = (message: Message): ShuffleAction => ({
  type: SHUFFLE,
  message
})

export const reset = (): ResetAction => ({
  type: RESET
})
