import { ID, UID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { Status } from '~/models/Status'

export type Cacheable<T> = {
  metadata: T
  _timestamp: number
}

export type Cache<T> = {
  entries: { [id: number]: Cacheable<T> }
  statuses: { [id: number]: Status }
  uids: { [uid: string]: ID }
  subscribers: { [id: number]: Set<UID> }
  subscriptions: { [id: number]: Set<{ uid: UID; kind: Kind }> }
  idsToPrune: Set<ID>
  entryTTL: number
}
