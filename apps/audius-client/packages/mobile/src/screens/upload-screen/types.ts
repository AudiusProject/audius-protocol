import type { Nullable, Genre } from '@audius/common'

export type CompleteTrackValues = {
  name: Nullable<string>
  description: Nullable<string>
  genre: Nullable<Genre>
  artwork: { url: Nullable<string> }
}
