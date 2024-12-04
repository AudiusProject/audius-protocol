import { ID, UID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'

export type Entry<EntryT extends Metadata = Metadata> = {
  id: ID
  uid?: UID
  metadata: EntryT
  timestamp?: number
}

export type EntryMap<EntryT extends Metadata = Metadata> = {
  [id: string]: Entry<EntryT>
}

export type EntriesByKind<EntryT extends Metadata = Metadata> = {
  [key in Kind]?: EntryMap<EntryT>
}

export type Metadata = {
  blocknumber?: number
  local?: boolean
} & Record<string, any>
