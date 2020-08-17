import Collection from './Collection'
import { PlayableType } from './common/Identifiers'
import Track from './Track'

type Playable =
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

export default Playable
