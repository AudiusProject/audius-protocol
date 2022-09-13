import {
  Kind,
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
  queueSelectors
} from '@audius/common'
import {
  all,
  call,
  cancel,
  delay,
  put,
  fork,
  select,
  take,
  takeEvery,
  takeLatest,
  getContext
} from 'redux-saga/effects'

import { getToQueue } from 'common/store/queue/sagas'

const { getSource, getUid, getPositions } = queueSelectors
const { getUid: getCurrentPlayerTrackUid } = playerSelectors
const { getUsers } = cacheUsersSelectors
const { getTrack, getTracks } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors

// This is copied from web/src/utils since moving it to common would require
// changing 90+ files. This will be ignored in RN-reloaded, since we check
// isNativeMobile from storeContext first.
export const isMobile = () => {
  let check = false
  ;(function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
        a.substr(0, 4)
      )
    )
      check = true
  })(navigator.userAgent || navigator.vendor || window.opera)
  // iPad iOS 13
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    check = true
  return check
}

const makeCollectionSourceId = (source, playlistId) =>
  `${source}:collection:${playlistId}`
const getEntryId = (entry) => `${entry.kind}:${entry.id}`

const flatten = (list) =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])
function* filterDeletes(tracksMetadata, removeDeleted) {
  const tracks = yield select(getTracks)
  const users = yield select(getUsers)
  return tracksMetadata
    .map((metadata) => {
      // If the incoming metadata is null, return null
      // This will be accounted for in `nullCount`
      if (metadata === null) {
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
    ? yield select(sourceSelector)
    : initLineup.prefix

  const task = yield fork(function* () {
    try {
      yield put(
        lineupActions.fetchLineupMetadatasRequested(
          action.offset,
          action.limit,
          action.overwrite,
          action.payload
        )
      )

      // Let page animations on mobile have time to breathe
      // TODO: Get rid of this once we figure out how to make loading better
      const isNativeMobile = yield getContext('isNativeMobile')
      if (!isNativeMobile && isMobile()) {
        yield delay(100)
      }

      const lineupMetadatasResponse = yield call(lineupMetadatasCall, {
        offset: action.offset,
        limit: action.limit,
        payload: action.payload
      })

      if (lineupMetadatasResponse === null) return
      const lineup = yield select(lineupSelector)
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

      // Filter out deletes
      const responseFilteredDeletes = yield call(
        filterDeletes,
        lineupMetadatasResponse,
        removeDeleted
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
              makeCollectionSourceId(source, metadata.playlist_id),
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
      // Retain specified info in the lineup itself and resolve with success.
      const lineupEntries = allMetadatas
        .map(retainSelector)
        .map((m, i) => {
          const lineupEntry = allMetadatas[i]
          // Use metadata.uid, entry.uid, computed new uid in that order of precedence
          return { ...m, uid: m.uid || lineupEntry.uid || uids[i] }
        })
        .filter((metadata, idx) => {
          if (lineup.dedupe && lineup.entryIds) {
            const entryId = getEntryId(metadata)
            if (lineup.entryIds.has(entryId)) return false
            lineup.entryIds.add(entryId)
          }
          return true
        })

      const deletedCount = action.limit - lineupEntries.length - nullCount
      yield put(
        lineupActions.fetchLineupMetadatasSucceeded(
          lineupEntries,
          action.offset,
          action.limit,
          deletedCount,
          nullCount
        )
      )

      // Add additional items to the queue if need be.
      yield fork(updateQueueLineup, lineupPrefix, source, lineupEntries)
    } catch (err) {
      console.error(err)
      yield put(lineupActions.fetchLineupMetadatasFailed())
    }
  })
  const { source: resetSource } = yield take(
    baseLineupActions.addPrefix(lineupPrefix, baseLineupActions.RESET)
  )
  // If a source is specified in the reset action, make sure it matches the lineup source
  // If not specified, cancel the fetchTrackMetdatas
  if (!resetSource || resetSource === initSource) {
    yield cancel(task)
  }
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
    const flattenedQueue = flatten(toQueue)
    yield put(queueActions.add({ entries: flattenedQueue }))
  }
}

function* play(lineupActions, lineupSelector, prefix, action) {
  const lineup = yield select(lineupSelector)
  const requestedPlayTrack = yield select(getTrack, { uid: action.uid })

  if (action.uid) {
    const source = yield select(getSource)
    const currentPlayerTrackUid = yield select(getCurrentPlayerTrackUid)
    if (
      !currentPlayerTrackUid ||
      action.uid !== currentPlayerTrackUid ||
      source !== lineup.prefix
    ) {
      const toQueue = yield all(
        lineup.entries.map((e) => call(getToQueue, lineup.prefix, e))
      )
      const flattenedQueue = flatten(toQueue)
      yield put(queueActions.clear({}))
      yield put(queueActions.add({ entries: flattenedQueue }))
    }
  }
  yield put(
    queueActions.play({
      uid: action.uid,
      trackId: requestedPlayTrack && requestedPlayTrack.track_id,
      source: prefix
    })
  )
}

function* pause(action) {
  yield put(queueActions.pause({}))
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
            makeCollectionSourceId(source, collection.playlist_id),
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
  if (lineup.inView) {
    yield put(
      lineupActions.fetchLineupMetadatas(
        0,
        action.limit || lineup.total,
        false,
        action.payload
      )
    )
  }
}

const keepUidAndKind = (entry) => ({
  uid: entry.uid,
  kind: entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS,
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
      this.watchReset(),
      this.watchAdd(),
      this.watchRemove(),
      this.watchUpdateLineupOrder(),
      this.watchRefreshInView()
    ]
  }
}
