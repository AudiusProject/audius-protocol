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
  getContext
} from '@audius/common'
import moment from 'moment'
import { call, select, put, takeEvery } from 'redux-saga/effects'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'

const { getUid: getPlayerUid } = playerSelectors
const { getSource } = queueSelectors
const { SAVE_TRACK, UNSAVE_TRACK } = tracksSocialActions
const { getLocalSaves, getLocalSave, getSavedTracksLineupUid, getSaves } =
  savedPageSelectors
const { getTracks: getCacheTracks } = cacheTracksSelectors

const getSavedTracks = (state) => state.pages.savedPage.tracks

const PREFIX = savedTracksActions.prefix

function* getTracks({ offset, limit }) {
  const isNativeMobile = yield getContext('isNativeMobile')
  const allSavedTracks = yield select(getSaves)
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
    const tracks = yield call(retrieveTracks, {
      trackIds: allSavedTrackIds.filter((id) => id !== null)
    })
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
function* watchSave() {
  yield takeEvery(SAVE_TRACK, function* (action) {
    const { trackId } = action

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
    yield put(saveActions.addLocalSave(trackId, localSaveUid))
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

function* watchUnsave() {
  yield takeEvery(UNSAVE_TRACK, function* (action) {
    const { trackId } = action
    const localSaveUid = yield select(getLocalSave, { id: trackId })
    const playerUid = yield select(getPlayerUid)
    const queueSource = yield select(getSource)

    yield put(saveActions.removeLocalSave(action.trackId))
    if (localSaveUid) {
      yield put(savedTracksActions.remove(Kind.TRACKS, localSaveUid))
      if (
        localSaveUid !== playerUid &&
        queueSource === QueueSource.SAVED_TRACKS
      ) {
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
