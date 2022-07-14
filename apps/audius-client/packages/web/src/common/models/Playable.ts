import { PlayableType } from '@audius/common'

import { Collection } from './Collection'
import { Track } from './Track'

export type Playable =
  | {
      metadata: Collection | null
      type: PlayableType.PLAYLIST
    }
  | {
      metadata: Collection | null
      type: PlayableType.ALBUM
    }
  | {
      metadata: Track | null
      type: PlayableType.TRACK
    }
