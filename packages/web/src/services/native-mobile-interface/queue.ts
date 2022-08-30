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
