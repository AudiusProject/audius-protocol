import { ID } from 'models/Identifiers'
import { Kind } from 'models/Kind'
import { Status } from 'models/Status'

import {
  CacheType,
  EntriesByKind,
  Entry,
  Metadata,
  SubscriberInfo,
  SubscriptionInfo,
  UnsubscribeInfo
} from './types'

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

type BaseAddAction<EntryT extends Metadata = Metadata> = {
  kind: Kind
  entries: Entry<EntryT>[]
  // replace optionally replaces the entire entry instead of joining metadata
  replace?: boolean
  // persist optionally persists the cache entry to indexdb
  persist?: boolean
}

export type AddAction<EntryT extends Metadata = Metadata> =
  BaseAddAction<EntryT> & {
    type: typeof ADD
  }

/**
 * Signals to add an entry to the cache.
 */
export const add = (
  kind: Kind,
  entries: Entry[],
  replace = false,
  persist = true
): AddAction => ({
  type: ADD,
  kind,
  entries,
  replace,
  persist
})

export type AddSuccededAction<EntryT extends Metadata = Metadata> =
  BaseAddAction<EntryT> & {
    type: typeof ADD_SUCCEEDED
  }

/**
 * Adds entries to the cache.
 */
export const addSucceeded = ({
  kind,
  entries,
  replace = false,
  persist = true
}: BaseAddAction): AddSuccededAction => ({
  type: ADD_SUCCEEDED,
  kind,
  entries,
  replace,
  persist
})

export type AddEntriesAction<EntryT extends Metadata = Metadata> = {
  type: typeof ADD_ENTRIES
  entriesByKind: EntriesByKind<EntryT>
  // replace optionally replaces the entire entry instead of joining metadata
  replace?: boolean
  // persist optionally persists the cache entry to indexdb
  persist?: boolean
}

/**
 * Signals to add an entries of multiple kinds to the cache.
 */
export const addEntries = (
  entriesByKind: EntriesByKind,
  replace = false,
  persist = true
): AddEntriesAction => ({
  type: ADD_ENTRIES,
  entriesByKind,
  replace,
  persist
})

/**
 * Updates an entry in the cache. Can also add transitive cache subscriptions.
 * E.g. if a collection references multiple tracks, the collection should be subscribed to those
 * tracks.
 */
export const update = (
  kind: Kind,
  entries: Entry[],
  subscriptions: SubscriptionInfo[] = []
) => ({
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
 */
export const increment = (kind: Kind, entries: Entry[]) => ({
  type: INCREMENT,
  kind,
  entries
})

/**
 * Sets the status of an entry from the cache as to be removed. The
 * entries actually get removed by the removeSucceeded action
 */
export const remove = (kind: Kind, ids: (ID | string)[]) => ({
  type: REMOVE,
  kind,
  ids
})

/**
 * Removes entries from the cache
 */
export const removeSucceeded = (kind: Kind, ids: ID[]) => ({
  type: REMOVE_SUCCEEDED,
  kind,
  ids
})

/**
 * Sets the status of N entries.
 */
export const setStatus = (
  kind: Kind,
  statuses: { id: ID; status: Status }[]
) => ({
  type: SET_STATUS,
  kind,
  statuses
})

/**
 * Subscribes uids to ids in the cache.
 */
export const subscribe = (kind: Kind, subscribers: SubscriberInfo[]) => ({
  type: SUBSCRIBE,
  kind,
  subscribers
})

/**
 * Unsubscribes a uid from an id in the cache. Automatically clears transitive subscriptions.
 */
export const unsubscribe = (kind: Kind, unsubscribers: UnsubscribeInfo[]) => ({
  type: UNSUBSCRIBE,
  kind,
  unsubscribers
})

/**
 * Realizes an unsubscription action and potentially removes the entry from the cache.
 */
export const unsubscribeSucceeded = (
  kind: Kind,
  unsubscribers: UnsubscribeInfo[]
) => ({
  type: UNSUBSCRIBE_SUCCEEDED,
  kind,
  unsubscribers
})

/**
 * Sets the timestamp of an entry to -1
 * @param {Kind} kind
 * @param {string} id
 */
export const setExpired = (kind: Kind, id: ID) => ({
  type: SET_EXPIRED,
  kind,
  id
})

export type SetCacheConfigAction = {
  cacheType: CacheType
  entryTTL: number
  simple: boolean
}

export const setCacheConfig = (config: SetCacheConfigAction) => ({
  type: SET_CACHE_CONFIG,
  ...config
})
