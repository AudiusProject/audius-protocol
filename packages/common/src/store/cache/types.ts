import { ID, UID } from 'models/Identifiers'
import { Kind } from 'models/Kind'
import { Status } from 'models/Status'

import { CacheType } from './actions'
export type Metadata = {
  blocknumber?: number
  local?: boolean
} & Record<string, any>

export type CacheEntry = { _timestamp: number; metadata: Metadata }

export type CacheSubscription = {
  id: ID
  kind: Kind
  uids: UID[]
}

export type CacheSubscriber = {
  uid: UID
  id?: ID | string
}

export type CacheState = {
  entries: Record<ID, { _timestamp: number; metadata: Metadata }>
  statuses: Record<ID, Status>
  uids: Record<UID, ID>
  subscribers: Record<ID, Set<UID>>
  subscriptions: Record<ID, Set<UID>>
  idsToPrune: Set<ID>
  cacheType: CacheType
  entryTTL: number
  simple: boolean
}
