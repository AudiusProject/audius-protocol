import { Cache, Track } from '../../../models'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}
