import { mergeWith, add } from 'lodash'

import {
  ADD_SUCCEEDED,
  UPDATE,
  REMOVE,
  REMOVE_SUCCEEDED,
  SET_STATUS,
  SUBSCRIBE,
  UNSUBSCRIBE_SUCCEEDED,
  SET_EXPIRED,
  INCREMENT
} from 'common/store/cache/actions'

/**
 * The cache is implemented as primarily a map of ids to metadata (track, playlist, collection).
 * Each entry can have N number of uids that point to it, e.g. a track may appear
 * on the page twice, only cached once, but referenced to by different uids.
 *
 * The cache adheres to a subscription model where each uid counts as a subscription to an entry.
 * When an entry in the cache is no longer subscribed to, it is pruned.
 *
 * Cache entries store metadata in the entries map and status on their retrieval in statuses.
 * The cache itself makes no guarantees as to whether statuses are updated.
 *
 * See the test.js for more detailed examples of usage.
 */
export const initialCacheState = {
  // id => entry
  entries: {},
  // id => status
  statuses: {},
  // uid => id
  uids: {},
  // id => Set(uid)
  subscribers: {}, // things subscribing to this cache id
  // id => Set({kind, uid})
  subscriptions: {}, // things this id is subscribing to,
  // Set { id }
  idsToPrune: new Set()
}

// Wraps a metadata into a cache entry
const wrapEntry = metadata => ({
  metadata,
  _timestamp: Date.now()
})

// Unwraps a cache entry into its public metadata
const unwrapEntry = entry => {
  if (entry && entry.metadata) {
    return entry.metadata
  }
  return {}
}

// These are fields we never want to merge -
// we should always prefer the latest update from
// backend.
const forceUpdateKeys = new Set([
  'field_visibility',
  'followee_reposts',
  'followee_saves'
])

// Customize lodash recursive merge to never merge
// the forceUpdateKeys, and special-case
// playlist_contents
export const mergeCustomizer = (objValue, srcValue, key) => {
  if (forceUpdateKeys.has(key)) {
    return srcValue
  }

  // For playlist_contents, this is trickier.
  // We want to never merge because playlists can have
  // tracks be deleted since last time, but
  // new fetches won't have UIDs, so we need to preserve those.
  if (objValue && key === 'playlist_contents') {
    // Map out tracks keyed by id, but store as an array-value
    // because a playlist can contain multiple of the same track id
    const trackMap = {}
    objValue.track_ids.forEach(t => {
      const id = t.track
      if (id in trackMap) {
        trackMap[id].push(t)
      } else {
        trackMap[id] = [t]
      }
    })

    const trackIds = srcValue.track_ids.map(t => {
      const mappedList = trackMap[t.track]
      if (!mappedList) return t

      const mappedTrack = mappedList.shift()
      if (!mappedTrack.uid) return t

      return {
        ...t,
        uid: mappedTrack.uid
      }
    })

    return { ...srcValue, track_ids: trackIds }
  }
}

const actionsMap = {
  [ADD_SUCCEEDED](state, action) {
    const newEntries = { ...state.entries }
    const newUids = { ...state.uids }
    const newSubscribers = { ...state.subscribers }
    const newIdsToPrune = new Set([...state.idsToPrune])

    action.entries.forEach(e => {
      // Don't add if block number is < existing
      const existing = unwrapEntry(newEntries[e.id])
      if (
        existing &&
        existing.blocknumber &&
        e.metadata.blocknumber &&
        existing.blocknumber > e.metadata.blocknumber
      ) {
        return
      }

      if (action.replace) newEntries[e.id] = wrapEntry(e.metadata)
      else {
        newEntries[e.id] = wrapEntry(
          mergeWith(
            {},
            { ...unwrapEntry(state.entries[e.id]) },
            e.metadata,
            mergeCustomizer
          )
        )
      }

      newUids[e.uid] = e.id
      if (e.id in newSubscribers) {
        newSubscribers[e.id].add(e.uid)
      } else {
        newSubscribers[e.id] = new Set([e.uid])
      }

      newIdsToPrune.delete(e.id)
    })

    return {
      ...state,
      entries: newEntries,
      uids: newUids,
      subscribers: newSubscribers,
      idsToPrune: newIdsToPrune
    }
  },
  [UPDATE](state, action) {
    const newEntries = { ...state.entries }
    const newSubscriptions = { ...state.subscriptions }

    action.entries.forEach(e => {
      newEntries[e.id] = wrapEntry(
        mergeWith(
          {},
          { ...unwrapEntry(state.entries[e.id]) },
          e.metadata,
          mergeCustomizer
        )
      )
    })

    action.subscriptions.forEach(s => {
      const { id, kind, uids } = s
      if (id in newSubscriptions) {
        uids.forEach(uid => {
          newSubscriptions[id].add({ kind, uid })
        })
      } else {
        newSubscriptions[id] = new Set(uids.map(uid => ({ kind, uid })))
      }
    })

    return {
      ...state,
      entries: newEntries,
      subscriptions: newSubscriptions
    }
  },
  [INCREMENT](state, action) {
    const newEntries = { ...state.entries }
    const newSubscriptions = { ...state.subscriptions }

    action.entries.forEach(e => {
      newEntries[e.id] = wrapEntry(
        mergeWith({}, { ...unwrapEntry(state.entries[e.id]) }, e.metadata, add)
      )
    })

    return {
      ...state,
      entries: newEntries
    }
  },
  [SET_STATUS](state, action) {
    const newStatuses = { ...state.statuses }

    action.statuses.forEach(s => {
      newStatuses[s.id] = s.status
    })

    return {
      ...state,
      statuses: newStatuses
    }
  },
  [SUBSCRIBE](state, action) {
    const newIdsToPrune = new Set([...state.idsToPrune])
    newIdsToPrune.delete(action.id)

    const newSubscribers = { ...state.subscribers }
    const newUids = { ...state.uids }

    action.subscribers.forEach(s => {
      const { id, uid } = s
      newSubscribers[id] = state.subscribers[id]
        ? state.subscribers[id].add(uid)
        : new Set([uid])
      newUids[uid] = id
    })

    return {
      ...state,
      uids: newUids,
      subscribers: newSubscribers,
      idsToPrune: newIdsToPrune
    }
  },
  [UNSUBSCRIBE_SUCCEEDED](state, action) {
    const newSubscribers = { ...state.subscribers }
    const newUids = { ...state.uids }

    action.unsubscribers.forEach(s => {
      const { uid, id = newUids[s.uid] } = s
      if (id in newSubscribers) {
        newSubscribers[id].delete(uid)
        delete newUids[uid]
      }
    })

    return {
      ...state,
      uids: newUids,
      subscribers: newSubscribers
    }
  },
  [REMOVE](state, action) {
    const newIdsToPrune = new Set([...state.idsToPrune])
    action.ids.forEach(id => {
      newIdsToPrune.add(id)
    })

    return {
      ...state,
      idsToPrune: newIdsToPrune
    }
  },
  [REMOVE_SUCCEEDED](state, action) {
    const newEntries = { ...state.entries }
    const newStatuses = { ...state.statuses }
    const newUids = { ...state.uids }
    const newSubscribers = { ...state.subscribers }
    const newSubscriptions = { ...state.subscriptions }
    const newIdsToPrune = new Set([...state.idsToPrune])

    // TODO: figure out why a remove is called to a non-existent subscriber
    if (action.ids) {
      action.ids.forEach(actionId => {
        if (newSubscribers[actionId]) {
          newSubscribers[actionId].forEach(uid => {
            delete newUids[uid]
          })
        }

        delete newEntries[actionId]
        delete newStatuses[actionId]
        delete newSubscribers[actionId]
        delete newSubscriptions[actionId]
        newIdsToPrune.delete(actionId)
      })
    }

    return {
      ...state,
      entries: newEntries,
      statuses: newStatuses,
      subscribers: newSubscribers,
      subscriptions: newSubscriptions,
      uids: newUids,
      idsToPrune: newIdsToPrune
    }
  },
  [SET_EXPIRED](state, action) {
    const newEntries = { ...state.entries }
    if (newEntries[action.id]) {
      newEntries[action.id] = {
        ...newEntries[action.id],
        _timestamp: -1
      }
    }
    return {
      ...state,
      entries: newEntries
    }
  }
}

export const asCache = (reducer, kind) => (state, action) => {
  if (action.kind && action.kind !== kind) return state

  const matchingReduceFunction = actionsMap[action.type]
  if (matchingReduceFunction) return matchingReduceFunction(state, action)

  return reducer(state, action)
}
