import { ID, UID, RepeatMode } from '@audius/common'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

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
    shuffleOrder: number[],
    queueAutoplay: boolean
  ) {
    super(MessageType.PERSIST_QUEUE, {
      tracks,
      index,
      shuffle,
      shuffleIndex,
      shuffleOrder,
      queueAutoplay
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
