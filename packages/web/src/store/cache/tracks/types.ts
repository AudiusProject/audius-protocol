import Track from 'models/Track'
import Cache from 'models/common/Cache'

interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}

export default TracksCacheState
