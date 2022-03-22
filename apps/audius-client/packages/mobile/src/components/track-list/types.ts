import { makeGetTableMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { SetOptional } from 'type-fest'

export type TrackMetadata = SetOptional<
  ReturnType<ReturnType<typeof makeGetTableMetadatas>>['entries'][0],
  'uid' | 'kind' | 'id' | 'followeeReposts'
>

export type TracksMetadata = TrackMetadata[]
