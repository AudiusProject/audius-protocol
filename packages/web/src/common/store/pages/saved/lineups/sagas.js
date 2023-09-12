import {
  Kind,
  makeUid,
  cacheTracksSelectors,
  savedPageTracksLineupActions as savedTracksActions,
  savedPageActions as saveActions,
  savedPageSelectors,
  queueActions,
  queueSelectors,
  tracksSocialActions,
  playerSelectors,
  QueueSource,
  getContext,
  LibraryCategory
} from '@audius/common'
import moment from 'moment'
import { call, select, put, takeEvery } from 'redux-saga/effects'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'

const { getUid: getPlayerUid } = playerSelectors
const { getSource } = queueSelectors
const { SAVE_TRACK, UNSAVE_TRACK, REPOST_TRACK, UNDO_REPOST_TRACK } =
  tracksSocialActions
const {
  getLocalTrackFavorite,
  getLocalTrackRepost,
  getSavedTracksLineupUid,
  getTrackSaves,
  getSelectedCategoryLocalTrackAdds
} = savedPageSelectors
const { getTracks: getCacheTracks } = cacheTracksSelectors

const getSavedTracks = (state) => state.pages.savedPage.tracks

const PREFIX = savedTracksActions.prefix

function* getTracks({ offset, limit }) {
  const isNativeMobile = yield getContext('isNativeMobile')
  const allSavedTracks = yield select(getTrackSaves)
  // Mobile currently uses infinite scroll instead of a virtualized list
  // so we need to apply the offset & limit
  const savedTracks = isNativeMobile
    ? allSavedTracks.slice(offset, offset + limit)
    : allSavedTracks

  const savedTrackIds = savedTracks.map((save) => save.save_item_id ?? null)
  const savedTrackTimestamps = savedTracks.reduce((map, save) => {
    map[save.save_item_id] = save.created_at
    return map
  }, {})

  const localLibraryAdditions = yield select(getSelectedCategoryLocalTrackAdds)
  const localLibraryAdditionsTrackIds = Object.keys(
    localLibraryAdditions
  ).filter((savedTrackId) => !savedTrackTimestamps[savedTrackId])
  const localLibraryAdditionsTimestamps = localLibraryAdditionsTrackIds.reduce(
    (map, saveId) => {
      map[saveId] = Date.now()
      return map
    },
    {}
  )

  const allSavedTrackIds = [...localLibraryAdditionsTrackIds, ...savedTrackIds]
  const allSavedTrackTimestamps = {
    ...localLibraryAdditionsTimestamps,
    ...savedTrackTimestamps
  }

  if (allSavedTrackIds.length > 0) {
    const tracks = yield call(retrieveTracks, {
      trackIds: allSavedTrackIds.filter((id) => id !== null)
    })
    const tracksMap = tracks.reduce((map, track) => {
      track.dateSaved = allSavedTrackTimestamps[track.track_id]

      map[track.track_id] = track
      return map
    }, {})
    return allSavedTrackIds.map((id) =>
      id ? tracksMap[id] : { kind: Kind.EMPTY }
    )
  }
  return []
}

const keepDateSaved = (entry) => ({
  uid: entry.uid,
  kind: entry.kind ?? (entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS),
  id: entry.track_id || entry.playlist_id,
  dateSaved: entry.dateSaved
})

const sourceSelector = () => PREFIX

class SavedTracksSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      savedTracksActions,
      getSavedTracks,
      getTracks,
      keepDateSaved,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

// If a local save is being done and the user is on the saved page route, make sure to update the lineup.
function* watchAddToLibrary() {
  yield takeEvery([SAVE_TRACK, REPOST_TRACK], function* (action) {
    const { trackId, type } = action

    const tracks = yield select(getCacheTracks, { ids: [trackId] })
    const track = tracks[trackId]
    if (track.has_current_user_saved) return

    const localSaveUid = makeUid(
      Kind.TRACKS,
      trackId,
      savedTracksActions.prefix
    )

    const newEntry = {
      uid: localSaveUid,
      kind: Kind.TRACKS,
      id: trackId,
      dateSaved: moment().format()
    }

    yield put(
      saveActions.addLocalTrack({
        trackId,
        uid: localSaveUid,
        category:
          type === SAVE_TRACK
            ? LibraryCategory.Favorite
            : LibraryCategory.Repost
      })
    )
    yield put(savedTracksActions.add(newEntry, trackId, undefined, true))

    const queueSource = yield select(getSource)
    if (queueSource === QueueSource.SAVED_TRACKS) {
      yield put(
        queueActions.add({
          entries: [
            {
              id: trackId,
              uid: localSaveUid,
              souce: savedTracksActions.prefix
            }
          ]
        })
      )
    }
  })
}

function* watchRemoveFromLibrary() {
  yield takeEvery([UNSAVE_TRACK, UNDO_REPOST_TRACK], function* (action) {
    const { trackId, type } = action
    const removedTrackSelector =
      type === UNSAVE_TRACK ? getLocalTrackFavorite : getLocalTrackRepost
    const removedTrackUid = yield select(removedTrackSelector, { id: trackId })
    const playerUid = yield select(getPlayerUid)
    const queueSource = yield select(getSource)

    yield put(
      saveActions.removeLocalTrack({
        trackId: action.trackId,
        category:
          type === UNSAVE_TRACK
            ? LibraryCategory.Favorite
            : LibraryCategory.Repost
      })
    )
    if (removedTrackUid) {
      yield put(savedTracksActions.remove(Kind.TRACKS, removedTrackUid))
      if (
        removedTrackUid !== playerUid &&
        queueSource === QueueSource.SAVED_TRACKS
      ) {
        yield put(queueActions.remove({ uid: removedTrackUid }))
      }
    }
    const lineupSaveUid = yield select(getSavedTracksLineupUid, { id: trackId })
    if (lineupSaveUid) {
      yield put(savedTracksActions.remove(Kind.TRACKS, lineupSaveUid))
      if (lineupSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: lineupSaveUid }))
      }
    }
  })
}

export default function sagas() {
  return new SavedTracksSagas()
    .getSagas()
    .concat(watchAddToLibrary, watchRemoveFromLibrary)
}
