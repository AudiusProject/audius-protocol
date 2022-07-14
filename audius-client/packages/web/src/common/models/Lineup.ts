import { ID, UID } from '@audius/common'

import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { Nullable } from 'common/utils/typeUtils'

export type Lineup<T, ExtraProps = {}> = {
  entries: T[]
  order: {
    [uid: string]: number
  }
  total: number
  deleted: number
  nullCount: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
} & ExtraProps

export type LineupStateTrack<T> = { uid: UID; kind: Kind; id: ID } & T

export type Order = Record<UID, number>

// Add possibility of attaching extra metadata to entries with type `T`
// e.g. DateAdded
export type LineupState<T> = {
  entries: Array<LineupStateTrack<T>>
  order: Order
  total: number
  deleted: number
  nullCount: number
  status: Status
  hasMore: boolean
  inView: boolean
  prefix: string
  page: number
  isMetadataLoading: boolean
  dedupe?: boolean
  containsDeleted: boolean
  maxEntries: Nullable<number>
  entryIds?: Nullable<Set<UID>>
}
