import { Cacheable } from '~/models'
import { CommonState } from '~/store/commonStore'
import { Uid } from '~/utils/uid'

import { ID, UID } from '../../models/Identifiers'
import { Kind } from '../../models/Kind'
import { User } from '../../models/User'

import { UsersCacheState } from './users/types'

/**
 * Selects from the cache and strips away cache-only fields.
 */
export function getEntry(
  state: CommonState,
  props: {
    kind: Kind.USERS
    id?: ID | null
    uid?: UID | null
  }
): User | null
export function getEntry(
  state: CommonState,
  props: {
    kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS>
    id?: ID | null
    uid?: UID | null
  }
): User | null
export function getEntry(
  state: CommonState,
  props: {
    kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS>
    id?: ID | null
    uid?: UID | null
  }
) {
  if (props.id) {
    const entry = getCache(state, props).entries[props.id]
    return entry ? entry.metadata : null
  }
  if (props.uid) {
    const id = Uid.fromString(props.uid).id
    const entry = getCache(state, props).entries[id]
    return entry ? entry.metadata : null
  }
  return null
}

/**
 * Selects the timestamps from the cache.
 */
export const getEntryTimestamp = (
  state: CommonState,
  {
    kind,
    id
  }: {
    kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS>
    id?: ID | string | null
  }
) => {
  if (kind && id) {
    const entries = getCache(state, { kind }).entries
    if (entries[id] !== undefined) return entries[id]._timestamp
  }
  return null
}

/**
 * Gets all cache entries and strips away cache-only fields.
 */
export function getAllEntries(
  state: CommonState,
  props: { kind: Kind.USERS }
): { [id: string]: Cacheable<User> }
export function getAllEntries(
  state: CommonState,
  props: { kind: Kind.USERS }
): { [id: string]: Cacheable<User> }
export function getAllEntries(
  state: CommonState,
  props: { kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS> }
) {
  return getCache(state, props).entries
}

export function getCache(
  state: CommonState,
  props: { kind: Kind.USERS }
): UsersCacheState
export function getCache(
  state: CommonState,
  props: { kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS> }
): UsersCacheState
export function getCache(
  state: CommonState,
  props: { kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS> }
) {
  switch (props.kind) {
    case Kind.USERS:
    default:
      return state.users
  }
}
