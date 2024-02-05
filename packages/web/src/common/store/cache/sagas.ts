import { Status } from '@audius/common/models'
import type { ID, Kind, Cache } from '@audius/common/models'
import { IntKeys, FeatureFlags } from '@audius/common/services'
import {
  cacheActions,
  cacheConfig,
  cacheSelectors,
  confirmerSelectors,
  getContext
} from '@audius/common/store'
import type {
  Metadata,
  Entry,
  SubscriberInfo,
  CacheType
} from '@audius/common/store'
import { makeUids, getIdFromKindId } from '@audius/common/utils'
import { pick } from 'lodash'
import { SelectEffect } from 'redux-saga/effects'
import { all, call, put, select, takeEvery } from 'typed-redux-saga'

const { CACHE_PRUNE_MIN } = cacheConfig
const { getConfirmCalls } = confirmerSelectors
const { getCache, getEntryTTL } = cacheSelectors

const isMissingFields = (cacheEntry: Entry, requiredFields: string[]) => {
  if (!requiredFields) return false
  for (const field of requiredFields) {
    if (!(field in cacheEntry)) {
      return true
    }
  }
  return false
}

// If timestamp provided, check if expired
const isExpired = (timestamp: number, entryTTL: number) => {
  if (timestamp) return timestamp + entryTTL < Date.now()
  return false
}

type AddToCacheHandler = (
  metadatas: Metadata[]
) => Generator<never, Metadata[] | void, unknown>

type RetrieveArgs<T> = {
  ids: (ID | string)[]
  selectFromCache: (
    ids: (ID | string)[]
  ) => Generator<SelectEffect, Record<ID | string, T>, T>
  getEntriesTimestamp: (ids: (ID | string)[]) => Generator<
    SelectEffect,
    {
      [id: ID | string]: number | null
    },
    any
  >
  retrieveFromSource: (
    ids: (ID | string)[]
  ) => Promise<T[]> | Generator<any, T[], any>
  kind: Kind
  idField: string
  requiredFields?: Set<string>
  forceRetrieveFromSource?: boolean
  shouldSetLoading?: boolean
  deleteExistingEntry?: boolean
  onBeforeAddToCache?: AddToCacheHandler
  onAfterAddToCache?: AddToCacheHandler
}

/**
 * Retrieves entries from the cache and if they are not found invokes a supplied
 * `retrieveFromSource` to make whatever expensive / network request that does
 * supply the resource.
 * @param {Object} args
 * @param {Array<ID>} args.ids ids (keys) to fetch from in the cache
 * @param {Function*} args.selectFromCache saga/generator that specifies the method to select from cache,
 *  e.g.
 *  `function * (ids) { return yield* select(getValues, { ids }) }`
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
export function* retrieve<T>({
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
  onBeforeAddToCache = function* (_metadatas) {},
  onAfterAddToCache = function* (_metadatas) {}
}: RetrieveArgs<T>): Generator<
  any,
  { entries: Record<ID | string, T>; uids: Record<ID | string, string> }
> {
  if (!ids.length) {
    return {
      entries: {},
      uids: {}
    }
  }

  const uniqueIds = [...new Set(ids)]
  // Create uids for each id and collect a mapping.
  const uids = makeUids([kind], uniqueIds).reduce<
    Record<number | string, string>
  >((map, uid, i) => {
    map[uniqueIds[i]] = uid
    return map
  }, {})

  // Get cached entries
  const [cachedEntries, timestamps] = yield* all([
    call(selectFromCache, uniqueIds),
    call(getEntriesTimestamp, uniqueIds)
  ])

  const entryTTL = yield* select(getEntryTTL)

  const idsToFetch: (ID | string)[] = []
  uniqueIds.forEach((id) => {
    const shouldFetch =
      !(id in cachedEntries) ||
      isMissingFields(cachedEntries[id] as Entry, [...requiredFields]) ||
      isExpired(timestamps[id] as number, entryTTL) ||
      forceRetrieveFromSource
    if (shouldFetch) {
      idsToFetch.push(id)
    }
  })

  // Retrieve IDs from source
  if (idsToFetch.length > 0) {
    yield* call(retrieveFromSourceThenCache, {
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
  const entries = yield* call(selectFromCache, uniqueIds)

  return {
    entries,
    uids
  }
}

type RetrieveFromSourceThenCacheArgs<T> = {
  idsToFetch: (ID | string)[]
  kind: Kind
  retrieveFromSource: (
    ids: (ID | string)[]
  ) => Promise<T[]> | Generator<any, T[], any>
  onBeforeAddToCache: AddToCacheHandler
  onAfterAddToCache: AddToCacheHandler
  shouldSetLoading: boolean
  deleteExistingEntry: boolean
  idField: string
  uids: Record<number | string, string>
}

function* retrieveFromSourceThenCache<T>({
  idsToFetch,
  kind,
  retrieveFromSource,
  onBeforeAddToCache,
  onAfterAddToCache,
  shouldSetLoading,
  deleteExistingEntry,
  idField,
  uids
}: RetrieveFromSourceThenCacheArgs<T>) {
  if (shouldSetLoading) {
    yield* put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map((id) => ({ id, status: Status.LOADING }))
      )
    )
  }
  let metadatas = yield* call(retrieveFromSource, idsToFetch) as unknown as T[]
  if (metadatas) {
    if (!Array.isArray(metadatas)) {
      metadatas = [metadatas]
    }
    // If we didn't get any entries, return early
    if (!metadatas.length) {
      return
    }

    // Perform any side effects
    const beforeAdd = yield* call(onBeforeAddToCache, metadatas)
    if (beforeAdd) {
      metadatas = beforeAdd
    }

    // Either add or update the cache. If we're doing a cache refresh post load, it should
    // be an update.
    const cacheMetadata = metadatas.map((m: Metadata) => ({
      id: m[idField],
      uid: uids[m[idField]],
      metadata: m
    }))

    yield* put(
      cacheActions.add(
        kind,
        cacheMetadata,
        // Rewrite the cache entry if we forced retrieving it from source
        deleteExistingEntry,
        // Always cache it persistently
        true
      )
    )

    // Perform any side effects
    yield* call(onAfterAddToCache, metadatas)

    yield* put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map((id) => ({ id, status: Status.SUCCESS }))
      )
    )
  } else {
    yield* put(
      cacheActions.setStatus(
        kind,
        idsToFetch.map((id) => ({ id, status: Status.ERROR }))
      )
    )
  }
}

export function* add(
  kind: Kind,
  entries: Entry[],
  replace?: boolean,
  persist?: boolean
) {
  // Get cached things that are confirming
  const confirmCalls = yield* select(getConfirmCalls)
  const cache = yield* select(getCache, { kind })
  const confirmCallsInCache = pick(
    cache.entries,
    Object.keys(confirmCalls).map((kindId) => getIdFromKindId(kindId))
  )

  const entriesToAdd: Entry[] = []
  const entriesToSubscribe: SubscriberInfo[] = []
  entries.forEach((entry) => {
    // If something is confirming and in the cache, we probably don't
    // want to replace it (unless explicit) because we would lose client
    // state, e.g. "has_current_user_reposted"
    if (!replace && entry.id in confirmCallsInCache && entry.uid) {
      entriesToSubscribe.push({ uid: entry.uid, id: entry.id })
    } else {
      entriesToAdd.push(entry)
    }
  })
  if (entriesToAdd.length > 0) {
    yield* put(
      cacheActions.addSucceeded({
        kind,
        entries: entriesToAdd,
        replace,
        persist
      })
    )
  }
  if (entriesToSubscribe.length > 0) {
    yield* put(cacheActions.subscribe(kind, entriesToSubscribe))
  }
}

// Adds entries but first checks if they are confirming.
// If they are, don't add or else we could be in an inconsistent state.
function* watchAdd() {
  yield* takeEvery(
    cacheActions.ADD,
    function* (action: ReturnType<typeof cacheActions.add>) {
      const { kind, entries, replace, persist } = action
      yield* call(add, kind, entries, replace, persist)
    }
  )
}

// Prune cache entries if there are no more subscribers.
function* watchUnsubscribe() {
  yield* takeEvery(
    cacheActions.UNSUBSCRIBE,
    function* (action: ReturnType<typeof cacheActions.unsubscribe>) {
      const { kind, unsubscribers } = action

      const cache = yield* select(getCache, { kind })

      // Remove all transitive subscriptions.
      const transitiveSubscriptions: {
        [key in Kind]?: SubscriberInfo[]
      } = {}
      unsubscribers.forEach((s) => {
        const { id = cache.uids[s.uid] } = s
        if (
          id in cache.subscriptions &&
          cache.subscribers[id] &&
          cache.subscribers[id].size <= 1
        ) {
          cache.subscriptions[id].forEach((subscription) => {
            if (!transitiveSubscriptions[subscription.kind]) {
              transitiveSubscriptions[subscription.kind] = [
                { id, uid: subscription.uid }
              ]
            } else {
              transitiveSubscriptions[subscription.kind]!.push({
                id,
                uid: subscription.uid
              })
            }
          })
        }
      })
      yield* all(
        Object.keys(transitiveSubscriptions).map((subscriptionKind) =>
          put(
            cacheActions.unsubscribe(
              subscriptionKind as Kind,
              transitiveSubscriptions[subscriptionKind as Kind]!
            )
          )
        )
      )

      yield* put(cacheActions.unsubscribeSucceeded(kind, unsubscribers))
    }
  )
}

function* watchUnsubscribeSucceeded() {
  yield* takeEvery(
    cacheActions.UNSUBSCRIBE_SUCCEEDED,
    function* (action: ReturnType<typeof cacheActions.unsubscribe>) {
      const { kind, unsubscribers } = action
      const cache = yield* select(getCache, { kind })

      const idsToRemove: (ID | string)[] = []
      unsubscribers.forEach((s) => {
        const { id } = s
        if (id && id in cache.subscribers && cache.subscribers[id].size === 0) {
          idsToRemove.push(id)
        }
      })
      if (idsToRemove.length > 0) {
        yield* put(cacheActions.remove(kind, idsToRemove))
      }
    }
  )
}

function* watchRemove() {
  yield* takeEvery(
    cacheActions.REMOVE,
    function* (action: ReturnType<typeof cacheActions.remove>) {
      const { kind } = action
      const cache: Cache<any> | null = yield* select(getCache, { kind })

      if (
        cache &&
        cache.idsToPrune &&
        cache.idsToPrune.size >= CACHE_PRUNE_MIN
      ) {
        yield* put(cacheActions.removeSucceeded(kind, [...cache.idsToPrune]))
      }
    }
  )
}

function* initializeCacheType() {
  const remoteConfig = yield* getContext('remoteConfigInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  yield* call(remoteConfig.waitForRemoteConfig)

  const fastCache = yield* call(getFeatureEnabled, FeatureFlags.FAST_CACHE)
  const safeFastCache = yield* call(
    getFeatureEnabled,
    FeatureFlags.SAFE_FAST_CACHE
  )

  let cacheType = 'normal'

  if (fastCache) {
    cacheType = 'fast'
  } else if (safeFastCache) {
    cacheType = 'safe-fast'
  }

  const cacheEntryTTL = remoteConfig.getRemoteVar(IntKeys.CACHE_ENTRY_TTL)!

  const simpleCache = yield* call(getFeatureEnabled, FeatureFlags.SIMPLE_CACHE)

  yield* put(
    cacheActions.setCacheConfig({
      cacheType: cacheType as CacheType,
      entryTTL: cacheEntryTTL,
      simple: simpleCache
    })
  )
}

const sagas = () => {
  return [
    initializeCacheType,
    watchAdd,
    watchUnsubscribe,
    watchUnsubscribeSucceeded,
    watchRemove
  ]
}

export default sagas
