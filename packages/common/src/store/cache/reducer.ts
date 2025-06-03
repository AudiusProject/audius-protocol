import { mergeWith, add } from 'lodash'

import { ID, UID } from '~/models/Identifiers'
import { Status } from '~/models/Status'

import { Kind } from '../../models/Kind'

import {
  ADD_SUCCEEDED,
  UPDATE,
  SET_STATUS,
  SUBSCRIBE,
  INCREMENT,
  AddSuccededAction,
  ADD_ENTRIES,
  AddEntriesAction,
  SetCacheConfigAction,
  SET_CACHE_CONFIG
} from './actions'
import { mergeCustomizer } from './mergeCustomizer'
import { Entry, Metadata } from './types'

type CacheState = {
  entries: Record<ID, { _timestamp: number; metadata: Metadata }>
  statuses: Record<ID, Status>
  uids: Record<UID, ID>
  entryTTL: number
}

/**
 * The cache is implemented as primarily a map of ids to metadata (track, playlist, collection).
 * Each entry can have N number of uids that point to it, e.g. a track may appear
 * on the page twice, only cached once, but referenced to by different uids.
 *
 * Cache entries store metadata in the entries map and status on their retrieval in statuses.
 * The cache itself makes no guarantees as to whether statuses are updated.
 *
 * See the test.js for more detailed examples of usage.
 */
export const initialCacheState: CacheState = {
  // id => entry
  entries: {},
  // id => status
  statuses: {},
  // uid => id
  uids: {},
  entryTTL: Infinity
}

// Wraps a metadata into a cache entry
const wrapEntry = (metadata: any, _timestamp?: number) => ({
  metadata,
  _timestamp: _timestamp ?? Date.now()
})

// Unwraps a cache entry into its public metadata
const unwrapEntry = (entry: { metadata: any }) => {
  if (entry && entry.metadata) {
    return entry.metadata
  }
  return null
}

const addEntries = (state: CacheState, entries: Entry[], replace?: boolean) => {
  const { entryTTL } = state
  const newEntries = { ...state.entries }
  const newUids = { ...state.uids }
  const now = Date.now()

  for (let i = 0; i < entries.length; i++) {
    const entity = entries[i]
    const { metadata: existing, _timestamp } = newEntries[entity.id] ?? {}

    // Don't add if block number is < existing
    if (
      existing &&
      existing.blocknumber &&
      entity.metadata.blocknumber &&
      existing.blocknumber > entity.metadata.blocknumber
    ) {
      // do nothing
    } else if (replace) {
      newEntries[entity.id] = wrapEntry(entity.metadata)
    } else if (existing && !existing.local && _timestamp + entryTTL > now) {
      // do nothing
    } else if (existing) {
      delete existing.local
      const newMetadata = mergeWith(
        {},
        existing,
        entity.metadata,
        mergeCustomizer
      )
      newEntries[entity.id] = wrapEntry(newMetadata, now)
    } else {
      newEntries[entity.id] = {
        _timestamp: entity.timestamp ?? now,
        metadata: entity.metadata
      }
      if (entity.uid) {
        newUids[entity.uid] = entity.id
      }
    }
  }

  return {
    ...state,
    entries: newEntries,
    uids: newUids
  }
}

const actionsMap = {
  [SET_CACHE_CONFIG](state: CacheState, action: SetCacheConfigAction) {
    const { entryTTL } = action
    return {
      ...state,
      entryTTL
    }
  },
  [ADD_SUCCEEDED](state: CacheState, action: AddSuccededAction) {
    const { entries, replace } = action
    return addEntries(state, entries, replace)
  },
  [ADD_ENTRIES](
    state: CacheState,
    action: AddEntriesAction,
    kind: Exclude<Kind, Kind.TRACKS | Kind.COLLECTIONS>
  ) {
    const { entriesByKind, replace } = action
    const matchingEntries = entriesByKind[kind] ?? {}
    const cacheableEntries: Entry[] = Object.entries(matchingEntries).map(
      ([id, entry]) => ({
        id: parseInt(id, 10),
        metadata: entry
      })
    )
    return addEntries(state, cacheableEntries, replace)
  },
  [UPDATE](state: CacheState, action: { entries: any[] }) {
    const newEntries = { ...state.entries }

    action.entries.forEach((e: { id: string | number; metadata: any }) => {
      const existing = { ...unwrapEntry(state.entries[e.id]) }
      const newEntry = mergeWith({}, existing, e.metadata, mergeCustomizer)
      newEntries[e.id] = wrapEntry(newEntry)
    })

    return {
      ...state,
      entries: newEntries
    }
  },
  [INCREMENT](state: any[], action: { entries: any[] }) {
    const newEntries = { ...state.entries }

    action.entries.forEach((e: { id: string | number; metadata: any }) => {
      newEntries[e.id] = wrapEntry(
        mergeWith({}, { ...unwrapEntry(state.entries[e.id]) }, e.metadata, add)
      )
    })

    return {
      ...state,
      entries: newEntries
    }
  },
  [SET_STATUS](state: { statuses: any }, action: { statuses: any[] }) {
    const newStatuses = { ...state.statuses }

    action.statuses.forEach((s: { id: string | number; status: any }) => {
      newStatuses[s.id] = s.status
    })

    return {
      ...state,
      statuses: newStatuses
    }
  },
  [SUBSCRIBE](state: CacheState, action: { id: any; subscribers: any[] }) {
    const newUids = { ...state.uids }

    action.subscribers.forEach((s: { id: any; uid: any }) => {
      const { id, uid } = s
      newUids[uid] = id
    })

    return {
      ...state,
      uids: newUids
    }
  }
}

export const asCache =
  (
    reducer: {
      (
        state: CacheState | undefined,
        action: any,
        kind: Kind
      ): {
        // id => entry
        entries: {}
        // id => status
        statuses: {}
        // uid => id
        uids: {}
      }
      (arg0: any, arg1: any): any
    },
    kind: Kind
  ) =>
  (state: any, action: { kind: Kind | Kind[]; type: string | number }) => {
    if (
      action.kind &&
      (typeof action.kind === 'string'
        ? action.kind !== kind
        : !action.kind.includes(kind))
    ) {
      return state
    }

    let updatedState = state

    const matchingReduceFunction = actionsMap[action.type]
    if (matchingReduceFunction) {
      updatedState = matchingReduceFunction(state, action, kind)
    }

    return reducer(updatedState, action, kind)
  }
