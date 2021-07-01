import Collection from './Collection'
import Track from './Track'
import { PlayableType } from './common/Identifiers'

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
