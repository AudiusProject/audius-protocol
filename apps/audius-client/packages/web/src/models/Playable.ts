import { Collection } from '../common/models/Collection'
import { PlayableType } from '../common/models/Identifiers'
import { Track } from '../common/models/Track'

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
