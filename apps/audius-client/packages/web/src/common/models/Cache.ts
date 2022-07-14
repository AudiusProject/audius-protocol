import { ID, UID } from '@audius/common'

import Kind from 'common/models/Kind'
import Status from 'common/models/Status'

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
