import { MessageType } from './types'
import { NativeMobileMessage } from './helpers'
import { RepeatMode } from 'store/queue/types'
import { ID, UID } from 'models/common/Identifiers'

// Array of m3u8 "data" files
type TrackInfo = {
  uri: string
  title: string
  artist: string
  artwork: string
  id: ID
  currentUserId: ID
  currentListenCount: number
  uid: UID
}
export type Tracks = TrackInfo[]

export class PersistQueueMessage extends NativeMobileMessage {
  constructor(
    tracks: Tracks,
    index: number,
    shuffle: boolean,
    shuffleIndex: number,
    shuffleOrder: number[]
  ) {
    super(MessageType.PERSIST_QUEUE, {
      tracks,
      index,
      shuffle,
      shuffleIndex,
      shuffleOrder
    })
  }
}

export class RepeatModeMessage extends NativeMobileMessage {
  constructor(repeatMode: RepeatMode) {
    super(MessageType.SET_REPEAT_MODE, { repeatMode })
  }
}

export class ShuffleMessage extends NativeMobileMessage {
  constructor(shuffle: boolean, shuffleIndex: number, shuffleOrder: number[]) {
    super(MessageType.SHUFFLE, { shuffle, shuffleIndex, shuffleOrder })
  }
}
