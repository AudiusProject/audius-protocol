import { ID, UID } from 'models/Identifiers'
import { Kind } from 'models/Kind'

export type CacheType = 'normal' | 'fast' | 'safe-fast'

export type Entry<EntryT extends Metadata = Metadata> = {
  id: ID
  uid?: UID
  metadata: EntryT
  timestamp?: number
}

export type EntriesByKind<EntryT extends Metadata = Metadata> = {
  [key in Kind]?: Entry<EntryT>[]
}

export type Metadata = {
  blocknumber?: number
  local?: boolean
} & Record<string, any>

export type SubscriberInfo = {
  uid: UID
  id: string | number
}

export type SubscriptionInfo = SubscriberInfo & {
  kind: Kind
}

export type UnsubscribeInfo = {
  uid: UID
  id?: string | number
}
