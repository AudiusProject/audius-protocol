import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class PlayTrackMessage extends NativeMobileMessage {
  constructor(m3u8: string) {
    super(MessageType.PLAY_TRACK, { m3u8 })
  }
}

export class PauseTrackMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.PAUSE_TRACK, {})
  }
}

export class GetPositionMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.GET_POSITION, {})
  }
}

export class SeekMessage extends NativeMobileMessage {
  constructor(seconds: number) {
    super(MessageType.SEEK_TRACK, { seconds })
  }
}
