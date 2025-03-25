import { Cache, ID, Remix, Track } from '../../../models'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: ID }
}

export type TrackWithRemix = Pick<Track, 'track_id' | 'title'> & {
  remix_of: { tracks: Pick<Remix, 'parent_track_id'>[] } | null
}
