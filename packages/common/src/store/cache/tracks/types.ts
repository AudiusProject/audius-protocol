import { Cache, Cacheable, ID, Track } from '../../../models'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: ID }
}

export type BatchCachedTracks = Omit<Cacheable<Track>, '_timestamp'>
