import { Cache, Track } from '@audius/common'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}
