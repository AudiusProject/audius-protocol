import { Cache, ID, Track } from '../../../models'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: ID }
}
