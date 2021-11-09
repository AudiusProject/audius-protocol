import Kind from 'audius-client/src/common/models/Kind'
import Status from 'audius-client/src/common/models/Status'

import { UID } from 'app/models/common/Identifiers'

export type Lineup<T, ExtraProps> = {
  entries: T[]
  order: {
    [uid: string]: number
  }
  total: number
  deleted: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
} & ExtraProps

export type LineupStateTrack<T> = { uid: UID; kind: Kind } & T

// Add possibility of attaching extra metadata to entries with type `T`
// e.g. DateAdded
export type LineupState<T> = {
  entries: Array<LineupStateTrack<T>>
  order: {
    [uid: string]: number
  }
  total: number
  deleted: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
}
