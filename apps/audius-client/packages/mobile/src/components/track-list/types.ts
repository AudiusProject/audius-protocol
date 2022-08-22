import type { lineupSelectors } from '@audius/common'
import type { SetOptional } from 'type-fest'

export type TrackMetadata = SetOptional<
  ReturnType<
    ReturnType<typeof lineupSelectors.makeGetTableMetadatas>
  >['entries'][0],
  'uid' | 'kind' | 'id' | 'followeeReposts'
>

export type TracksMetadata = TrackMetadata[]
