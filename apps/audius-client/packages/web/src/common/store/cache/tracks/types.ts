import Cache from 'common/models/Cache'
import Track from 'common/models/Track'

interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}

export default TracksCacheState
