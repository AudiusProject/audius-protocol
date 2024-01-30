// @ts-nocheck

import { ID, UID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'

import { Metadata } from './types'

export const ADD = 'CACHE/ADD'
export const ADD_SUCCEEDED = 'CACHE/ADD_SUCCEEDED'
export const ADD_ENTRIES = 'CACHE/ADD_ENTRIES'
export const UPDATE = 'CACHE/UPDATE'
export const INCREMENT = 'CACHE/INCREMENT'
export const SET_STATUS = 'CACHE/SET_STATUS'
export const SUBSCRIBE = 'CACHE/SUBSCRIBE'
export const UNSUBSCRIBE = 'CACHE/UNSUBSCRIBE'
export const UNSUBSCRIBE_SUCCEEDED = 'CACHE/UNSUBSCRIBE_SUCCEEDED'
export const REMOVE = 'CACHE/REMOVE'
export const REMOVE_SUCCEEDED = 'CACHE/REMOVE_SUCCEEDED'
export const SET_EXPIRED = 'CACHE/SET_EXPIRED'
export const SET_CACHE_CONFIG = 'CACHE/SET_CONFIG'

type Entry<EntryT extends Metadata = Metadata> = {
  id: ID
  uid?: UID
  metadata: EntryT
  timestamp?: number
}

/**
 * Signals to add an entry to the cache.
 * @param {Kind} kind
 * @param {array} entries { id, uid, metadata }
 * @param {boolean} replace optionally replaces the entire entry instead of joining metadata
 * @param {boolean} persist optionally persists the cache entry to indexdb
 */
export const add = (kind, entries, replace = false, persist = true) => ({
  type: ADD,
  kind,
  entries,
  replace,
  persist
})

export type AddSuccededAction<EntryT extends Metadata = Metadata> = {
  type: typeof ADD_SUCCEEDED
  kind: Kind
  entries: {
    id: ID
    uid: UID
    metadata: EntryT
    timestamp: number
  }[]
  // replace optionally replaces the entire entry instead of joining metadata
  replace?: boolean
  // persist optionally persists the cache entry to indexdb
  persist?: boolean
}

type EntriesByKind<EntryT extends Metadata = Metadata> = {
  [key: Kind]: Entry<EntryT>[]
}

export type AddEntriesAction<EntryT extends Metadata = Metadata> = {
  type: typeof ADD_ENTRIES
  kind: Kind[]
  entriesByKind: EntriesByKind<EntryT>
  // replace optionally replaces the entire entry instead of joining metadata
  replace?: boolean
  // persist optionally persists the cache entry to indexdb
  persist?: boolean
}

/**
 * Adds entries to the cache.
 */
export const addSucceeded = ({
  kind,
  entries,
  replace = false,
  persist = true
}: AddSuccededAction) => ({
  type: ADD_SUCCEEDED,
  kind,
  entries,
  replace,
  persist
})

/**
 * Signals to add an entries of multiple kinds to the cache.
 * @param {Kind} kind
 * @param {array} entries { id, uid, metadata }
 * @param {boolean} replace optionally replaces the entire entry instead of joining metadata
 * @param {boolean} persist optionally persists the cache entry to indexdb
 */
export const addEntries = (
  kind,
  entriesByKind,
  replace = false,
  persist = true
): AddEntriesAction => ({
  type: ADD_ENTRIES,
  kind,
  entriesByKind,
  replace,
  persist
})

/**
 * Updates an entry in the cache. Can also add transitive cache subscriptions.
 * E.g. if a collection references multiple tracks, the collection should be subscribed to those
 * tracks.
 * @param {Kind} kind
 * @param {array} entries { id, metadata }
 * @param {?array} subscriptions { id, kind, uids }
 */
export const update = (kind, entries, subscriptions = []) => ({
  type: UPDATE,
  kind,
  entries,
  subscriptions
})

/**
 * Issues a mathematical delta update to a cache entry's numeric field.
 * Only numeric fields should be part of the update if so, e.g.
 *  entries = [{ id: 2, metadata: { followee_count: 1 } }]
 * would yield an update to the cached followee_count of id 2 by 1.
 * @param {Kind} kind
 * @param {array} entries { id, metadata }
 */
export const increment = (kind, entries) => ({
  type: INCREMENT,
  kind,
  entries
})

/**
 * Sets the status of an entry from the cache as to be removed. The
 * entries actually get removed by the removeSucceeded action
 * @param {Kind} kind
 * @param {array} ids
 */
export const remove = (kind, ids) => ({
  type: REMOVE,
  kind,
  ids
})

/**
 * Removes entries from the cache
 * @param {Kind} kind
 * @param {array} ids
 */
export const removeSucceeded = (kind, ids) => ({
  type: REMOVE_SUCCEEDED,
  kind,
  ids
})

/**
 * Sets the status of N entries.
 * @param {Kind} kind
 * @param {array} statuses {id, status}
 */
export const setStatus = (kind, statuses) => ({
  type: SET_STATUS,
  kind,
  statuses
})

/**
 * Subscribes uids to ids in the cache.
 * @param {Kind} kind
 * @param {array} subscribers { uid, id }
 */
export const subscribe = (kind, subscribers) => ({
  type: SUBSCRIBE,
  kind,
  subscribers
})

/**
 * Unsubscribes a uid from an id in the cache. Automatically clears transitive subscriptions.
 * @param {Kind} kind
 * @param {array} unsubscribers { uid, id? } if id is not provided, looks it up in the cache uids
 */
export const unsubscribe = (kind, unsubscribers) => ({
  type: UNSUBSCRIBE,
  kind,
  unsubscribers
})

/**
 * Realizes an unsubscription action and potentially removes the entry from the cache.
 * @param {Kind} kind
 * @param {array} unsubscribers { uid, id? }
 */
export const unsubscribeSucceeded = (kind, unsubscribers) => ({
  type: UNSUBSCRIBE_SUCCEEDED,
  kind,
  unsubscribers
})

/**
 * Sets the timestamp of an entry to -1
 * @param {Kind} kind
 * @param {string} id
 */
export const setExpired = (kind, id) => ({
  type: SET_EXPIRED,
  kind,
  id
})

export type CacheType = 'normal' | 'fast' | 'safe-fast'

export type SetCacheConfigAction = {
  cacheType: CacheType
  entryTTL: number
  simple: boolean
}

export const setCacheConfig = (config: SetCacheConfigAction) => ({
  type: SET_CACHE_CONFIG,
  ...config
})
