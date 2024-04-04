import { Collection, Track } from '~/models'

import { Nullable } from './typeUtils'

/** Typeguard for determiniing if content is a Track */
export const isContentTrack = (
  content: Nullable<Partial<Track | Collection>>
): content is Track => !!content && 'track_id' in content

/** Typeguard for determiniing if content is a Collection */
export const isContentCollection = (
  content: Nullable<Partial<Track | Collection>>
): content is Collection => !!content && 'playlist_id' in content
