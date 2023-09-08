import type { Track } from '@audius/common'

export type TrackImage = Pick<
  Track,
  'cover_art' | 'cover_art_sizes' | 'cover_art_cids'
>
