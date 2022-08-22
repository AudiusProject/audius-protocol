import { Cache, Track } from '../../../models/index'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}
