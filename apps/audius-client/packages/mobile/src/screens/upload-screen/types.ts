import type { Nullable, Genre } from '@audius/common'

export type TrackMetadata = {
  name: Nullable<string>
  description: Nullable<string>
  genre: Nullable<Genre>
  artwork: { url: Nullable<string> }
}

export type CompletedTrackMetadata = {
  name: string
  description: Nullable<string>
  genre: Genre
  artwork: { url: string }
}
