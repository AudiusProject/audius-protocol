import {
  Kind,
  Name,
  makeUid,
  makeUids,
  Uid,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheActions,
  cacheUsersSelectors,
  lineupActions as baseLineupActions,
  queueActions,
  playerSelectors,
  queueSelectors,
  getContext,
  FeatureFlags,
  isContentUSDCPurchaseGated,
  hasStreamAccess,
  StringKeys,
  premiumTracksPageLineupActions,
  accountSelectors
} from '@audius/common'
import {
  all,
  call,
  delay,
  put,
  fork,
  select,
  take,
  takeEvery,
  takeLatest,
  race
} from 'redux-saga/effects'

import { getToQueue } from 'common/store/queue/sagas'
import { isMobileWeb } from 'common/utils/isMobileWeb'
import { isPreview } from 'common/utils/isPreview'

const { getSource, getUid, getPositions } = queueSelectors
const { getUid: getCurrentPlayerTrackUid, getPlaying } = playerSelectors
const { getUsers } = cacheUsersSelectors
const { getTrack, getTracks } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { getUserId } = accountSelectors

const getEntryId = (entry) => `${entry.kind}:${entry.id}`

const flatten = (list) =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

function* filterDeletes(tracksMetadata, removeDeleted, lineupPrefix) {
  const tracks = yield select(getTracks)
  const users = yield select(getUsers)
  const remoteConfig = yield getContext('remoteConfigInstance')
  const getFeatureEnabled = yield getContext('getFeatureEnabled')
  yield call(remoteConfig.waitForRemoteConfig)

  const isUSDCGatedContentEnabled = yield getFeatureEnabled(
    FeatureFlags.USDC_PURCHASES
  )

  const deniedHandles = remoteConfig
    .getRemoteVar(StringKeys.EXPLORE_PREMIUM_DENIED_USERS)
    ?.split(',')

  return tracksMetadata
    .map((metadata) => {
      // If the incoming metadata is null, return null
      // This will be accounted for in `nullCount`
      if (metadata === null) {
        return null
      }

      // Treat usdc content as deleted if feature is not enabled
      // TODO: https://linear.app/audius/issue/PAY-1533/remove-usdc-feature-flag
      // Remove this when removing the feature flags
      if (
        !isUSDCGatedContentEnabled &&
        metadata.is_stream_gated &&
        isContentUSDCPurchaseGated(metadata.stream_conditions)
      ) {
        return null
      }

      // Only allow a whitelist of artists to be featured on premium tracks explore page. TODO:
      // https://linear.app/audius/issue/PAY-2085/update-whitelist-of-artists-to-feature-on-explore-premium-tracks-page
      if (
        lineupPrefix === premiumTracksPageLineupActions.prefix &&
        metadata.is_stream_gated &&
        isContentUSDCPurchaseGated(metadata.stream_conditions) &&
        deniedHandles.includes(users[metadata.owner_id].handle)
      ) {
        return null
      }

      // If we said to remove deleted tracks and it is deleted, remove it
      if (removeDeleted && metadata.is_delete) return null
      // If we said to remove deleted and the track/playlist owner is deactivated, remove it
      else if (removeDeleted && users[metadata.owner_id]?.is_deactivated)
        return null
      else if (
        removeDeleted &&
        users[metadata.playlist_owner_id]?.is_deactivated
      )
        return null
      // If the track was not cached, keep it
      else if (!tracks[metadata.track_id]) return metadata
      // If we said to remove deleted and it's marked deleted remove it
      else if (removeDeleted && tracks[metadata.track_id]._marked_deleted)
        return null
      return {
        ...metadata,
        // Maintain the marked deleted
        _marked_deleted: !!tracks[metadata.track_id]._marked_deleted
      }
    })
    .filter(Boolean)
}

function getTrackCacheables(metadata, uid, trackSubscribers) {
  trackSubscribers.push({ uid: metadata.uid || uid, id: metadata.track_id })
}

function getCollectionCacheables(
  metadata,
  uid,
  collectionsToCache,
  trackSubscriptions,
  trackSubscribers
) {
  collectionsToCache.push({ id: metadata.playlist_id, uid, metadata })

  const trackIds = metadata.playlist_contents.track_ids.map((t) => t.track)
  const trackUids = trackIds.map((id) =>
    makeUid(Kind.TRACKS, id, `collection:${metadata.playlist_id}`)
  )

  trackSubscriptions.push({
    id: metadata.playlist_id,
    kind: Kind.TRACKS,
    uids: trackUids
  })
  metadata.playlist_contents.track_ids =
    metadata.playlist_contents.track_ids.map((t, i) => {
      const trackUid = t.uid || trackUids[i]
      trackSubscribers.push({ uid: trackUid, id: t.track })
      return { uid: trackUid, ...t }
    })
}

function* fetchLineupMetadatasAsync(
  lineupActions,
  lineupMetadatasCall,
  lineupSelector,
  retainSelector,
  lineupPrefix,
  removeDeleted,
  sourceSelector,
  action
) {
  const initLineup = yield select(lineupSelector)
  const initSource = sourceSelector
    ? yield select((state) =>
        sourceSelector(state, action.handle?.toLowerCase())
      )
    : initLineup.prefix

  function* fetchLineupMetadatasTask() {
    try {
      yield put(
        lineupActions.fetchLineupMetadatasRequested(
          action.offset,
          action.limit,
          action.overwrite,
          action.payload,
          action.handle?.toLowerCase()
        )
      )

      // Let page animations on mobile have time to breathe
      // TODO: Get rid of this once we figure out how to make loading better
      const isNativeMobile = yield getContext('isNativeMobile')
      if (!isNativeMobile && isMobileWeb()) {
        yield delay(100)
      }

      const lineupMetadatasResponse = yield call(lineupMetadatasCall, action)

      if (lineupMetadatasResponse === null) {
        yield put(lineupActions.fetchLineupMetadatasFailed())
      }
      const lineup = yield select((state) =>
        lineupSelector(state, action.handle?.toLowerCase())
      )
      const source = sourceSelector
        ? yield select(sourceSelector)
        : lineup.prefix

      const queueUids = Object.keys(yield select(getPositions)).map((uid) =>
        Uid.fromString(uid)
      )
      // Get every UID in the queue whose source references this lineup
      // in the form of { id: [uid1, uid2] }
      const uidForSource = queueUids
        .filter((uid) => uid.source === source)
        .reduce((mapping, uid) => {
          if (uid.id in mapping) {
            mapping[uid.id].push(uid.toString())
          } else {
            mapping[uid.id] = [uid.toString()]
          }
          return mapping
        }, {})

      // Filter out deletes (and premium content if disabled)
      const responseFilteredDeletes = yield call(
        filterDeletes,
        lineupMetadatasResponse,
        removeDeleted,
        lineupPrefix
      )

      const nullCount = lineupMetadatasResponse.reduce(
        (result, current) => (current === null ? result + 1 : result),
        0
      )

      const allMetadatas = responseFilteredDeletes.map((item) => {
        const id = item.track_id
        if (id && uidForSource[id] && uidForSource[id].length > 0) {
          item.uid = uidForSource[id].shift()
        }
        return item
      })

      const kinds = allMetadatas.map((metadata) =>
        metadata.track_id ? Kind.TRACKS : Kind.COLLECTIONS
      )
      const ids = allMetadatas.map(
        (metadata) => metadata.track_id || metadata.playlist_id
      )
      const uids = makeUids(kinds, ids, source)

      // Cache tracks and collections.
      const collectionsToCache = []

      const trackSubscriptions = []
      let trackSubscribers = []

      allMetadatas.forEach((metadata, i) => {
        // Need to update the UIDs on the playlist tracks
        if (metadata.playlist_id) {
          getCollectionCacheables(
            metadata,
            uids[i],
            collectionsToCache,
            trackSubscriptions,
            trackSubscribers
          )
        } else if (metadata.track_id) {
          getTrackCacheables(metadata, uids[i], trackSubscribers)
        }
      })

      const lineupCollections = allMetadatas.filter(
        (item) => !!item.playlist_id
      )

      lineupCollections.forEach((metadata) => {
        const trackUids = metadata.playlist_contents.track_ids.map(
          (track, idx) => {
            const id = track.track
            const uid = new Uid(
              Kind.TRACKS,
              id,
              Uid.makeCollectionSourceId(source, metadata.playlist_id),
              idx
            )
            return { id, uid: uid.toString() }
          }
        )
        trackSubscribers = trackSubscribers.concat(trackUids)
      })

      // We rewrote the playlist tracks with new UIDs, so we need to update them
      // in the cache.
      if (collectionsToCache.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, collectionsToCache))
      }
      if (trackSubscriptions.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, [], trackSubscriptions))
      }
      if (trackSubscribers.length > 0) {
        yield put(cacheActions.subscribe(Kind.TRACKS, trackSubscribers))
      }
      const currentUserId = yield select(getUserId)
      // Retain specified info in the lineup itself and resolve with success.
      const lineupEntries = allMetadatas
        .map(retainSelector)
        .map((m, i) => {
          const lineupEntry = allMetadatas[i]
          // Use metadata.uid, entry.uid, computed new uid in that order of precedence
          return {
            ...m,
            uid: m.uid || lineupEntry.uid || uids[i],
            isPreview: isPreview(lineupEntry, currentUserId)
          }
        })
        .filter((metadata, idx) => {
          if (lineup.dedupe && lineup.entryIds) {
            const entryId = getEntryId(metadata)
            if (lineup.entryIds.has(entryId)) return false
            lineup.entryIds.add(entryId)
          }
          return true
        })

      const deletedCount =
        lineupMetadatasResponse.length -
        responseFilteredDeletes.length -
        nullCount
      yield put(
        lineupActions.fetchLineupMetadatasSucceeded(
          lineupEntries,
          action.offset,
          action.limit,
          deletedCount,
          nullCount,
          action.handle?.toLowerCase()
        )
      )

      // Add additional items to the queue if need be.
      yield fork(updateQueueLineup, lineupPrefix, source, lineupEntries)
    } catch (err) {
      console.error(err)
      yield put(lineupActions.fetchLineupMetadatasFailed())
    }
  }

  function* shouldCancelTask() {
    while (true) {
      const { source: resetSource } = yield take(
        baseLineupActions.addPrefix(lineupPrefix, baseLineupActions.RESET)
      )

      // If a source is specified in the reset action, make sure it matches the lineup source
      // If not specified, cancel the fetchTrackMetdatas
      if (!resetSource || resetSource === initSource) {
        return true
      }
    }
  }

  yield race({
    task: call(fetchLineupMetadatasTask),
    cancel: call(shouldCancelTask)
  })
}

function* updateQueueLineup(lineupPrefix, source, lineupEntries) {
  const queueSource = yield select(getSource)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    const toQueue = yield all(
      lineupEntries.map((e) => call(getToQueue, lineupPrefix, e))
    )
    const flattenedQueue = flatten(toQueue).filter((e) => Boolean(e))
    yield put(queueActions.add({ entries: flattenedQueue }))
  }
}

function* play(lineupActions, lineupSelector, prefix, action) {
  const lineup = yield select(lineupSelector)
  const requestedPlayTrack = yield select(getTrack, { uid: action.uid })
  let isPreview = !!action.isPreview

  // If preview isn't forced, check for track acccess and switch to preview
  // if the user doesn't have access but the track is previewable
  if (!isPreview && requestedPlayTrack?.is_stream_gated) {
    const hasAccess = yield call(hasStreamAccess, requestedPlayTrack)
    isPreview = !hasAccess && !!requestedPlayTrack.preview_cid
  }

  if (action.uid) {
    const source = yield select(getSource)
    const currentPlayerTrackUid = yield select(getCurrentPlayerTrackUid)
    if (
      !currentPlayerTrackUid ||
      action.uid !== currentPlayerTrackUid ||
      source !== lineup.prefix
    ) {
      const toQueue = yield all(
        lineup.entries.map(function* (e) {
          const queueable = yield call(getToQueue, lineup.prefix, e)
          // If the entry is the one we're playing, set isPreview to incoming
          // value
          if (queueable?.uid === action.uid) {
            queueable.isPreview = isPreview
          }
          return queueable
        })
      )
      const flattenedQueue = flatten(toQueue).filter((e) => Boolean(e))
      yield put(queueActions.clear({}))
      yield put(queueActions.add({ entries: flattenedQueue }))
    }
  }
  yield put(
    queueActions.play({
      uid: action.uid,
      isPreview,
      trackId: requestedPlayTrack && requestedPlayTrack.track_id,
      source: prefix
    })
  )
}

function* pause(action) {
  yield put(queueActions.pause({}))
}

function* togglePlay(lineupActions, lineupSelector, prefix, action) {
  const isPlaying = yield select(getPlaying)
  const analytics = yield getContext('analytics')

  const playingUid = yield select(getCurrentPlayerTrackUid)
  const isPlayingUid = playingUid === action.uid

  if (!isPlayingUid || !isPlaying) {
    yield put(lineupActions.play(action.uid))
    analytics.track({
      eventName: Name.PLAYBACK_PLAY,
      id: `${action.id}`,
      source: action.source
    })
  } else {
    yield put(lineupActions.pause())
    analytics.track({
      eventName: Name.PLAYBACK_PAUSE,
      id: `${action.id}`,
      source: action.source
    })
  }
}

function* reset(
  lineupActions,
  lineupPrefix,
  lineupSelector,
  sourceSelector,
  action
) {
  const lineup = yield select(lineupSelector)
  // Remove this lineup as a subscriber from all of its tracks and collections.
  const subscriptionsToRemove = {} // keyed by kind
  const source = sourceSelector ? yield select(sourceSelector) : lineupPrefix

  for (const entry of lineup.entries) {
    const { kind, uid } = entry
    if (!subscriptionsToRemove[kind]) {
      subscriptionsToRemove[kind] = [{ uid }]
    } else {
      subscriptionsToRemove[kind].push({ uid })
    }
    if (entry.kind === Kind.COLLECTIONS) {
      const collection = yield select(getCollection, { uid: entry.uid })
      const removeTrackIds = collection.playlist_contents.track_ids.map(
        ({ track: trackId }, idx) => {
          const trackUid = new Uid(
            Kind.TRACKS,
            trackId,
            Uid.makeCollectionSourceId(source, collection.playlist_id),
            idx
          )
          return { UID: trackUid.toString() }
        }
      )
      subscriptionsToRemove[Kind.TRACKS] = (
        subscriptionsToRemove[Kind.TRACKS] || []
      ).concat(removeTrackIds)
    }
  }
  yield all(
    Object.keys(subscriptionsToRemove).map((kind) =>
      put(cacheActions.unsubscribe(kind, subscriptionsToRemove[kind]))
    )
  )

  yield put(lineupActions.resetSucceeded(action))
}

function* add(action) {
  if (action.entry && action.id) {
    const { kind, uid } = action.entry
    yield put(cacheActions.subscribe(kind, [{ uid, id: action.id }]))
  }
}

function* remove(action) {
  if (action.kind && action.uid) {
    yield put(cacheActions.unsubscribe(action.kind, [{ uid: action.uid }]))
  }
}

function* updateLineupOrder(lineupPrefix, sourceSelector, action) {
  // TODO: Investigate a better way to handle reordering of the lineup and transitively
  // reordering the queue. This implementation is slightly buggy in that the source may not
  // be set on the queue item when reordering and the next track won't resume correctly.
  const queueSource = yield select(getSource)
  const source = yield select(sourceSelector)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    yield put(queueActions.reorder({ orderedUids: action.orderedIds }))
  }
}

function* refreshInView(lineupActions, lineupSelector, action) {
  const lineup = yield select(lineupSelector)
  const { type: _ignoredType, limit, overwrite, payload, ...other } = action
  yield put(
    lineupActions.fetchLineupMetadatas(
      0,
      limit || lineup.total,
      overwrite,
      payload,
      other
    )
  )
}

const keepUidAndKind = (entry) => ({
  uid: entry.uid,
  kind: entry.kind ?? (entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS),
  id: entry.track_id || entry.playlist_id
})

/**
 * A generic class of common Lineup Sagas for fetching, loading and
 * simple playback.
 * @example
 *  // playlist.js
 *  // Creates an exports and array of all sagas to be combined in the
 *  // root saga.
 *  class PlaylistSagas extends LineupSagas {
 *    constructor() {
 *      const selector = store => store.playlist
 *      super("PLAYLIST", playlistActions, selector, Backend.getPlaylist)
 *    }
 *  }
 *  export default function sagas () {
 *    return new PlaylistSagas().getSagas()
 *  }
 */
export class LineupSagas {
  /**
   * @param {string} prefix the prefix for the lineup, e.g. FEED
   * @param {object} actions the actions class instance for the lineup
   * @param {function} selector the selector for the lineup, e.g. state => state.feed
   * @param {function * | async function} lineupMetadatasCall
   *   the backend call to make to fetch the tracks metadatas for the lineup
   * @param {?function} retainSelector a selector used to retain various metadata inside the lineup state
   *   otherwise, the lineup will only retain the track id indexing into the cache
   * @param {?boolean} removeDeleted whether or not to prune deleted tracks
   * @param {?function} sourceSelector optional selector that sets the UID source for entries
   */
  constructor(
    prefix,
    actions,
    selector,
    lineupMetadatasCall,
    retainSelector = keepUidAndKind,
    removeDeleted = true,
    sourceSelector = null
  ) {
    this.prefix = prefix
    this.actions = actions
    this.selector = selector
    this.lineupMetadatasCall = lineupMetadatasCall
    this.retainSelector = retainSelector
    this.removeDeleted = removeDeleted
    this.sourceSelector = sourceSelector
  }

  watchFetchLineupMetadata = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.FETCH_LINEUP_METADATAS
        ),
        fetchLineupMetadatasAsync,
        instance.actions,
        instance.lineupMetadatasCall,
        instance.selector,
        instance.retainSelector,
        instance.prefix,
        instance.removeDeleted,
        instance.sourceSelector
      )
    }
  }

  watchPlay = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PLAY),
        play,
        instance.actions,
        instance.selector,
        instance.prefix
      )
    }
  }

  watchTogglePlay = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.TOGGLE_PLAY
        ),
        togglePlay,
        instance.actions,
        instance.selector,
        instance.prefix
      )
    }
  }

  watchPauseTrack = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PAUSE),
        pause
      )
    }
  }

  watchReset = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.RESET),
        reset,
        instance.actions,
        instance.prefix,
        instance.selector,
        instance.sourceSelector
      )
    }
  }

  watchAdd = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.ADD),
        add
      )
    }
  }

  watchRemove = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.REMOVE),
        remove
      )
    }
  }

  watchUpdateLineupOrder = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.UPDATE_LINEUP_ORDER
        ),
        updateLineupOrder,
        instance.prefix,
        instance.sourceSelector
      )
    }
  }

  watchRefreshInView = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.REFRESH_IN_VIEW
        ),
        refreshInView,
        instance.actions,
        instance.selector
      )
    }
  }

  getSagas() {
    return [
      this.watchFetchLineupMetadata(),
      this.watchPlay(),
      this.watchPauseTrack(),
      this.watchTogglePlay(),
      this.watchReset(),
      this.watchAdd(),
      this.watchRemove(),
      this.watchUpdateLineupOrder(),
      this.watchRefreshInView()
    ]
  }
}
