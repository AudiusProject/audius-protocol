import type { Kind } from '@audius/common/models'
import { IntKeys } from '@audius/common/services'
import {
  cacheActions,
  cacheSelectors,
  confirmerSelectors,
  getContext
} from '@audius/common/store'
import type { Entry, SubscriberInfo } from '@audius/common/store'
import { getIdFromKindId } from '@audius/common/utils'
import { pick } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

const { getConfirmCalls } = confirmerSelectors
const { getCache } = cacheSelectors

function* add(
  kind: Exclude<Kind, Kind.TRACKS>,
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

function* initializeCacheType() {
  const remoteConfig = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfig.waitForRemoteConfig)

  const cacheEntryTTL = remoteConfig.getRemoteVar(IntKeys.CACHE_ENTRY_TTL)!

  yield* put(
    cacheActions.setCacheConfig({
      entryTTL: cacheEntryTTL
    })
  )
}

const sagas = () => {
  return [initializeCacheType, watchAdd]
}

export default sagas
