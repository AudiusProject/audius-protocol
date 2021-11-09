import Kind from 'audius-client/src/common/models/Kind'
import Status from 'audius-client/src/common/models/Status'

import { ID, UID } from 'app/models/common/Identifiers'

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
