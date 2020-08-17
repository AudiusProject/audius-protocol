import { ID, UID } from 'models/common/Identifiers'
import { Kind, Status } from 'store/types'

export type Cacheable<T> = {
  metadata: T
  _timestamp: number
}

type Cache<T> = {
  entries: { [id: number]: Cacheable<T> }
  statuses: { [id: number]: Status }
  uids: { [uid: string]: ID }
  subscribers: { [id: number]: Set<UID> }
  subscriptions: { [id: number]: Set<{ uid: UID; kind: Kind }> }
  idsToPrune: Set<ID>
}

export default Cache
