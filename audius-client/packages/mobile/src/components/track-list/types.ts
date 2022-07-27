import type { makeGetTableMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import type { SetOptional } from 'type-fest'

export type TrackMetadata = SetOptional<
  ReturnType<ReturnType<typeof makeGetTableMetadatas>>['entries'][0],
  'uid' | 'kind' | 'id' | 'followeeReposts'
>

export type TracksMetadata = TrackMetadata[]
