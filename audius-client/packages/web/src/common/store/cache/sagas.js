import { pick } from 'lodash'
import { all, call, put, select, takeEvery, spawn } from 'redux-saga/effects'

import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import * as cacheActions from 'common/store/cache/actions'
import { getCollections } from 'common/store/cache/collections/selectors'
import { CACHE_PRUNE_MIN } from 'common/store/cache/config'
import { getCache } from 'common/store/cache/selectors'
import { getTracks } from 'common/store/cache/tracks/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import { makeUids, makeKindId, getIdFromKindId } from 'common/utils/uid'
import { getConfirmCalls } from 'store/confirmer/selectors'
import * as persistentCache from 'utils/persistentCache'

const DEFAULT_ENTRY_TTL = 5 /* min */ * 60 /* seconds */ * 1000 /* ms */
const REFRESH_BLACKLIST_INTERVAL_MS = 3 /* seconds */ * 1000 /* ms */

const isMissingFields = (cacheEntry, requiredFields) => {
  if (!requiredFields) return false
  for (const field of requiredFields) {
    if (!(field in cacheEntry)) {
      return true
    }
  }
  return false
}

// If timestamp provided, check if expired
const isExpired = timestamp => {
  if (timestamp) return timestamp + DEFAULT_ENTRY_TTL < Date.now()
  return false
}

// Makes a transformer function for persistent cache.
// Removes UIDs from a collection's trackIds.
const makeTransformer = kind => metadata => {
  if (kind !== Kind.COLLECTIONS || !metadata.playlist_contents) return metadata

  return {
    ...metadata,
    playlist_contents: {
      track_ids: metadata.playlist_contents.track_ids.map(c => ({
        track: c.track,
        time: c.time
      }))
    }
  }
}

const cooldownBlacklist = {
  users: new Set(),
  tracks: new Set(),
  collections: new Set()
}

/**
 * Retrieves entries from the cache and if they are not found invokes a supplied
 * `retrieveFromSource` to make whatever expensive / network request that does
 * supply the resource.
 * @param {Object} args
 * @param {Array<ID>} args.ids ids (keys) to fetch from in the cache
 * @param {Function*} args.selectFromCache saga/generator that specifies the method to select from cache,
 *  e.g.
 *  `function * (ids) { return yield select(getValues, { ids }) }`
 * @param {Function} args.getEntriesTimestamp return a mapping from id => timestamp
 * @param {Function} args.retrieveFromSource function that can retrieve an entry from its source
 *  (not the cache).
 * @param {Kind} args.kind specific cache kind
 * @param {string} args.idField the field on the entry itself that is the `ID`
 * @param {Set?} args.requiredFields any required fields that must exist on the existing entry or else
 * it `retrieveFromSource` will be invoked
 * @param {boolean?} args.forceRetrieveFromSource Forces the cached entry to be re-fetched
 * @param {boolean?} args.shouldSetLoading whether or not to actually change the status to loading during a refetch
 * @param {boolean?} args.deleteExistingEntry whether or not to delete the entry in the cache. Generally, unsafe to do
 * because some parts of the UI may depend on fields that you might destroy with this.
 * @param {function*} args.onBeforeAddToCache callback to invoke with metadatas before they are added to the cache
 * optionally may return custom metadatas to be cached instead of what metadatas are passed to the function
 * @param {function*} args.onAfterAddToCache callback to invoke with metadatas after they are added to the cache
 *
 */
export function* retrieve({
  ids,
  selectFromCache,
  getEntriesTimestamp,
  retrieveFromSource,
  kind,
  idField,
  requiredFields = new Set(),
  forceRetrieveFromSource = false,
  shouldSetLoading = true,
  deleteExistingEntry = false,
  onBeforeAddToCache = function* (metadatas) {},
  onAfterAddToCache = function* (metadatas) {}
}) {
  if (!ids.length) {
    return {
      entries: [],
      uids: []
    }
  }

  const uniqueIds = [...new Set(ids)]
  // Create uids for each id and collect a mapping.
  const uids = makeUids(kind, uniqueIds).reduce((map, uid, i) => {
    map[uniqueIds[i]] = uid
    return map
  }, {})

  // Get cached entries
  const [cachedEntries, timestamps] = yield all([
    call(selectFromCache, uniqueIds),
    call(getEntriesTimestamp, uniqueIds)
  ])

  // Figure out which IDs we need to retrive from source
  const idsToFetch = []
  uniqueIds.forEach(id => {
    if (
      !(id in cachedEntries) ||
      isMissingFields(cachedEntries[id], requiredFields) ||
      isExpired(timestamps[id]) ||
      forceRetrieveFromSource
    ) {
      idsToFetch.push(id)
    }
  })

  // Retrieve IDs from source
  if (idsToFetch.length > 0) {
    yield call(retrieveFromSourceThenCache, {
      idsToFetch,
      kind,
      retrieveFromSource,
      onBeforeAddToCache,
      onAfterAddToCache,
      shouldSetLoading,
      deleteExistingEntry,
      idField,
      uids
    })
  }

  // Get the final cached items
  const entries = yield call(selectFromCache, uniqueIds)

  // Refresh items that were cached
  if (persistentCache.isCacheEnabled()) {
    yield spawn(refreshCachedItems, {
      kind,
      cachedEntries,
      idField,
      retrieveFromSource,
      onBeforeAddToCache,
      onAfterAddToCache,
      deleteExistingEntry,
      uids
    })
  }

  return {
    entries,
    uids
  }
}

function* refreshCachedItems({
  kind,
  cachedEntries,
  idField,
  retrieveFromSource,
  onBeforeAddToCache,
  onAfterAddToCache,
  deleteExistingEntry,
  uids
}) {
  const idBlacklist = (() => {
    switch (kind) {
      case Kind.COLLECTIONS:
        return cooldownBlacklist.collections
      case Kind.TRACKS:
        return cooldownBlacklist.tracks
      case Kind.USERS:
      default:
        return cooldownBlacklist.users
    }
  })()

  // Find non-blacklisted IDs. We do this bc we don't want to hammer
  // the BE with repeated requests for the same IDs, so we add a cooldown
  // period per request before we can request it again.
  //
  // This part is a bit weird because cachedEntries may actually be keyed
  // by handle (not ID) for users, but we want the idBlacklist to only ever
  // contain IDs. But we need to pass whatever keys cachedEntries into
  // retrieveFromSource, since it expects that format (e.g. handles)
  const keysToRefresh = Object.keys(cachedEntries).filter(key => {
    const id = cachedEntries[key][idField]
    return !idBlacklist.has(id)
  })

  if (!keysToRefresh.length) return

  // Add them to the blacklist
  keysToRefresh.forEach(key => idBlacklist.add(cachedEntries[key][idField]))
  // Clear them from the blacklist after a timeout
  setTimeout(() => {
    keysToRefresh.forEach(key => {
      const entry = cachedEntries[key]
      if (!entry) return
      idBlacklist.delete(entry[idField])
    })
  }, REFRESH_BLACKLIST_INTERVAL_MS)

  yield call(retrieveFromSourceThenCache, {
    idsToFetch: keysToRefresh,
    kind,
    retrieveFromSource,
    onBeforeAddToCache,
    onAfterAddToCache,
    shouldSetLoading: false,
    deleteExistingEntry: false,
    idField,
    uids
  })
}

function* retrieveFromSourceThenCache({
  idsToFetch,
  kind,
  retrieveFromSource,
  onBeforeAddToCache,
  onAfterAddToCache,
  shouldSetLoading,
  deleteExistingEntry,
  idField,
  uids
}) {
  if (shouldSetLoading) {
    yield put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map(id => ({ id, status: Status.LOADING }))
      )
    )
  }
  let metadatas = yield call(retrieveFromSource, idsToFetch)
  if (metadatas) {
    if (!Array.isArray(metadatas)) {
      metadatas = [metadatas]
    }
    // If we didn't get any entries, return early
    if (!metadatas.length) {
      return
    }

    // Perform any side effects
    const beforeAdd = yield call(onBeforeAddToCache, metadatas)
    if (beforeAdd) {
      metadatas = beforeAdd
    }

    // Either add or update the cache. If we're doing a cache refresh post load, it should
    // be an update.
    const cacheMetadata = metadatas.map(m => ({
      id: m[idField],
      uid: uids[m[idField]],
      metadata: m
    }))

    yield call(
      add,
      kind,
      cacheMetadata,
      // Rewrite the cache entry if we forced retrieving it from source
      deleteExistingEntry,
      // Always cache it persistently
      true
    )

    // Perform any side effects
    yield call(onAfterAddToCache, metadatas)

    yield put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map(id => ({ id, status: Status.SUCCESS }))
      )
    )
  } else {
    yield put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map(id => ({ id, status: Status.ERROR }))
      )
    )
  }
}

export function* add(kind, entries, replace, persist) {
  // Get cached things that are confirming
  const confirmCalls = yield select(getConfirmCalls)
  const cache = yield select(getCache, { kind })
  const confirmCallsInCache = pick(
    cache.entries,
    Object.keys(confirmCalls).map(kindId => getIdFromKindId(kindId))
  )

  const entriesToAdd = []
  const entriesToSubscribe = []
  entries.forEach(entry => {
    // If something is confirming and in the cache, we probably don't
    // want to replace it (unless explicit) because we would lose client
    // state, e.g. "has_current_user_reposted"
    if (!replace && entry.id in confirmCallsInCache) {
      entriesToSubscribe.push({ uid: entry.uid, id: entry.id })
    } else {
      entriesToAdd.push(entry)
    }
  })
  if (entriesToAdd.length > 0) {
    yield put(cacheActions.addSucceeded(kind, entriesToAdd, replace, persist))
  }
  if (entriesToSubscribe.length > 0) {
    yield put(cacheActions.subscribe(kind, entriesToSubscribe))
  }
}

// Adds entries but first checks if they are confirming.
// If they are, don't add or else we could be in an inconsistent state.
function* watchAdd() {
  yield takeEvery(cacheActions.ADD, function* (action) {
    const { kind, entries, replace, persist } = action
    yield call(add, kind, entries, replace, persist)
  })
}

// Adds to the persistent cache
function* watchAddSucceeded() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* ({
    kind,
    entries,
    replace,
    persist
  }) {
    if (!persist) return

    // Adding to cache can be fire and forget
    yield entries.forEach(e =>
      persistentCache.add(
        kind,
        e.id,
        e.metadata,
        replace,
        makeTransformer(kind)
      )
    )
  })
}

function* watchUpdate() {
  yield takeEvery(cacheActions.UPDATE, function* ({ kind, entries }) {
    yield entries.forEach(e =>
      persistentCache.update(kind, e.id, e.metadata, makeTransformer(kind))
    )
  })
}

// Prune cache entries if there are no more subscribers.
function* watchUnsubscribe() {
  yield takeEvery(cacheActions.UNSUBSCRIBE, function* (action) {
    const { kind, unsubscribers } = action

    const cache = yield select(getCache, { kind })

    // Remove all transitive subscriptions.
    const transitiveSubscriptions = {} // keyed by Kind
    unsubscribers.forEach(s => {
      const { id = cache.uids[s.uid] } = s
      if (
        id in cache.subscriptions &&
        cache.subscribers[id] &&
        cache.subscribers[id].size <= 1
      ) {
        cache.subscriptions[id].forEach(subscription => {
          if (!transitiveSubscriptions[subscription.kind]) {
            transitiveSubscriptions[subscription.kind] = [
              { uid: subscription.uid }
            ]
          } else {
            transitiveSubscriptions[subscription.kind].push({
              uid: subscription.uid
            })
          }
        })
      }
    })
    yield all(
      Object.keys(transitiveSubscriptions).map(subscriptionKind =>
        put(
          cacheActions.unsubscribe(
            subscriptionKind,
            transitiveSubscriptions[subscriptionKind]
          )
        )
      )
    )

    yield put(cacheActions.unsubscribeSucceeded(kind, unsubscribers))
  })
}

function* watchUnsubscribeSucceeded() {
  yield takeEvery(cacheActions.UNSUBSCRIBE_SUCCEEDED, function* (action) {
    const { kind, unsubscribers } = action
    const cache = yield select(getCache, { kind })

    const idsToRemove = []
    unsubscribers.forEach(s => {
      const { id } = s
      if (id && id in cache.subscribers && cache.subscribers[id].size === 0) {
        idsToRemove.push(id)
      }
    })
    if (idsToRemove.length > 0) {
      yield put(cacheActions.remove(kind, idsToRemove))
    }
  })
}

function* watchRemove() {
  yield takeEvery(cacheActions.REMOVE, function* (action) {
    const { kind } = action
    const cache = yield select(getCache, { kind })

    if (cache && cache.idsToPrune && cache.idsToPrune.size >= CACHE_PRUNE_MIN) {
      yield put(cacheActions.removeSucceeded(kind, [...cache.idsToPrune]))
    }
  })
}

export function* hydrateStoreFromCache() {
  const { collections, users, tracks } = yield call(persistentCache.getAllItems)

  // Only add items that aren't in the store already, because getAllItems
  // runs async, so these entities may be already in the store.
  const existingTracks = yield select(getTracks)
  const existingUsers = yield select(getUsers)
  const existingCollections = yield select(getCollections)

  const filteredTracks = tracks.filter(({ id }) => !existingTracks[id])
  const filteredUsers = users.filter(({ id }) => !existingUsers[id])
  const filteredCollections = collections.filter(
    ({ id }) => !existingCollections[id]
  )

  yield all([
    put(
      cacheActions.add(
        Kind.TRACKS,
        filteredTracks,
        /* replace */ false,
        /*  persist */ false
      )
    ),
    put(
      cacheActions.add(
        Kind.USERS,
        filteredUsers,
        /* replace */ false,
        /*  persist */ false
      )
    ),
    put(
      cacheActions.add(
        Kind.COLLECTIONS,
        filteredCollections,
        /* replace */ false,
        /*  persist */ false
      )
    )
  ])
}

const sagas = () => {
  return [
    watchAdd,
    watchAddSucceeded,
    watchUnsubscribe,
    watchUnsubscribeSucceeded,
    watchRemove,
    watchUpdate
  ]
}

export default sagas
