import moment from 'moment'
import { call, select, put, takeEvery } from 'redux-saga/effects'

import Kind from 'common/models/Kind'
import { getTracks as getCacheTracks } from 'common/store/cache/tracks/selectors'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import * as saveActions from 'common/store/pages/saved-page/actions'
import {
  PREFIX,
  tracksActions as savedTracksActions
} from 'common/store/pages/saved-page/lineups/tracks/actions'
import {
  getLocalSaves,
  getLocalSave,
  getSavedTracksLineupUid,
  getSaves
} from 'common/store/pages/saved-page/selectors'
import * as queueActions from 'common/store/queue/slice'
import { SAVE_TRACK, UNSAVE_TRACK } from 'common/store/social/tracks/actions'
import { makeUid } from 'common/utils/uid'
import { LineupSagas } from 'store/lineup/sagas'
import { getUid as getPlayerUid } from 'store/player/selectors'

const getSavedTracks = (state) => state.pages.savedPage.tracks

function* getTracks() {
  const savedTracks = yield select(getSaves)
  const savedTrackIds = savedTracks.map((save) => save.save_item_id)
  const savedTrackTimestamps = savedTracks.reduce((map, save) => {
    map[save.save_item_id] = save.created_at
    return map
  }, {})

  const localSaves = yield select(getLocalSaves)
  const localSavedTrackIds = Object.keys(localSaves).filter(
    (savedTrackId) => !savedTrackTimestamps[savedTrackId]
  )
  const localSavedTrackTimestamps = localSavedTrackIds.reduce((map, saveId) => {
    map[saveId] = Date.now()
    return map
  }, {})

  const allSavedTrackIds = [...localSavedTrackIds, ...savedTrackIds]
  const allSavedTrackTimestamps = {
    ...localSavedTrackTimestamps,
    ...savedTrackTimestamps
  }

  if (allSavedTrackIds.length > 0) {
    const tracks = yield call(retrieveTracks, { trackIds: allSavedTrackIds })
    const tracksMap = tracks.reduce((map, track) => {
      // If the track hasn't confirmed save from the backend, pretend it is for the client.
      if (!track.has_current_user_saved) {
        track.has_current_user_saved = true
        track.save_count += 1
      }
      track.dateSaved = allSavedTrackTimestamps[track.track_id]

      map[track.track_id] = track
      return map
    }, {})
    return allSavedTrackIds.map((id) => tracksMap[id])
  }
  return []
}

const keepDateSaved = (entry) => ({
  uid: entry.uid,
  kind: entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS,
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
function* watchSave() {
  yield takeEvery(SAVE_TRACK, function* (action) {
    const { trackId } = action

    const tracks = yield select(getCacheTracks, { ids: [trackId] })
    const track = tracks[trackId]
    if (track.has_current_user_saved) return

    const localSaveUid = makeUid(
      Kind.TRACKS,
      trackId,
      savedTracksActions.PREFIX
    )

    const newEntry = {
      uid: localSaveUid,
      kind: Kind.TRACKS,
      id: trackId,
      dateSaved: moment().format()
    }
    yield put(saveActions.addLocalSave(trackId, localSaveUid))
    yield put(savedTracksActions.add(newEntry, trackId))
    yield put(
      queueActions.add({
        entries: [
          {
            id: trackId,
            uid: localSaveUid,
            souce: savedTracksActions.PREFIX
          }
        ]
      })
    )
  })
}

function* watchUnsave() {
  yield takeEvery(UNSAVE_TRACK, function* (action) {
    const { trackId } = action
    const localSaveUid = yield select(getLocalSave, { id: trackId })
    const playerUid = yield select(getPlayerUid)
    yield put(saveActions.removeLocalSave(action.trackId))
    if (localSaveUid) {
      yield put(savedTracksActions.remove(Kind.TRACKS, localSaveUid))
      if (localSaveUid !== playerUid) {
        yield put(queueActions.remove({ uid: localSaveUid }))
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
  return new SavedTracksSagas().getSagas().concat(watchSave, watchUnsave)
}
