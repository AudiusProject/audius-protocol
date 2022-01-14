import { Track } from 'audius-client/src/common/models/Track'

export type TrackImage = Pick<Track, 'cover_art' | 'cover_art_sizes'>
