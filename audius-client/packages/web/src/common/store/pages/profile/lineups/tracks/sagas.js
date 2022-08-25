import {
  Kind,
  accountSelectors,
  cacheTracksActions,
  cacheTracksSelectors,
  cacheUsersSelectors,
  profilePageSelectors,
  TracksSortMode,
  profilePageTracksLineupActions as tracksActions,
  profilePageTracksLineupActions as lineupActions,
  tracksSocialActions,
  waitForValue,
  waitForAccount
} from '@audius/common'
import { all, call, select, takeEvery, put } from 'redux-saga/effects'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'store/lineup/sagas'

import { retrieveUserTracks } from './retrieveUserTracks'
const { SET_ARTIST_PICK } = tracksSocialActions
const { getProfileUserId, getProfileTracksLineup, getProfileUserHandle } =
  profilePageSelectors
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors
const { DELETE_TRACK } = cacheTracksActions
const getUserId = accountSelectors.getUserId
const PREFIX = tracksActions.prefix

function* getTracks({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  yield waitForAccount()
  const currentUserId = yield select(getUserId)

  // Wait for user to receive social handles
  // We need to know ahead of time whether we want to request
  // the "artist pick" track in addition to the artist's tracks.
  // TODO: Move artist pick to chain/discprov to avoid this extra trip
  const user = yield call(
    waitForValue,
    getUser,
    {
      handle: handle.toLowerCase()
    },
    (user) => 'twitter_handle' in user
  )
  const sort = payload.sort === TracksSortMode.POPULAR ? 'plays' : 'date'
  const getUnlisted = true

  if (user._artist_pick) {
    let [pinnedTrack, processed] = yield all([
      call(retrieveTracks, { trackIds: [user._artist_pick] }),
      call(retrieveUserTracks, {
        handle,
        currentUserId,
        sort,
        limit,
        offset,
        getUnlisted
      })
    ])

    // Pinned tracks *should* be unpinned
    // when deleted, but just in case they're not,
    // defend against that edge case here.
    if (!pinnedTrack.length || pinnedTrack[0].is_delete) {
      pinnedTrack = []
    }

    const pinnedTrackIndex = processed.findIndex(
      (track) => track.track_id === user._artist_pick
    )
    if (offset === 0) {
      // If pinned track found in tracksResponse,
      // put it to the front of the list, slicing it out of tracksResponse.
      if (pinnedTrackIndex !== -1) {
        return pinnedTrack
          .concat(processed.slice(0, pinnedTrackIndex))
          .concat(processed.slice(pinnedTrackIndex + 1))
      }
      // If pinned track not in tracksResponse,
      // add it to the front of the list.
      return pinnedTrack.concat(processed)
    } else {
      // If we're paginating w/ offset > 0
      // set the pinned track as null.
      // This will be handled by `filterDeletes` via `nullCount`
      if (pinnedTrackIndex !== -1) {
        return processed.map((track, i) =>
          i === pinnedTrackIndex ? null : track
        )
      }
      return processed
    }
  } else {
    const processed = yield call(retrieveUserTracks, {
      handle,
      currentUserId,
      sort,
      limit,
      offset,
      getUnlisted
    })
    return processed
  }
}

const sourceSelector = (state) => `${PREFIX}:${getProfileUserId(state)}`

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      getProfileTracksLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

function* watchSetArtistPick() {
  yield takeEvery(SET_ARTIST_PICK, function* (action) {
    const lineup = yield select(getProfileTracksLineup)
    const updatedOrderUid = []
    for (const [entryUid, order] of Object.entries(lineup.order)) {
      const track = yield select(getTrack, { uid: entryUid })
      const isArtistPick = track.track_id === action.trackId

      if (isArtistPick) updatedOrderUid.push({ uid: entryUid, order: 0 })
      else updatedOrderUid.push({ uid: entryUid, order: order + 1 })
    }
    updatedOrderUid.sort((a, b) => a.order - b.order)
    const updatedLineupOrder = updatedOrderUid.map(({ uid }) => uid)

    yield put(lineupActions.updateLineupOrder(updatedLineupOrder))
  })
}

function* watchDeleteTrack() {
  yield takeEvery(DELETE_TRACK, function* (action) {
    const { trackId } = action
    const lineup = yield select(getProfileTracksLineup)
    const trackLineupEntry = lineup.entries.find(
      (entry) => entry.id === trackId
    )
    if (trackLineupEntry) {
      yield put(tracksActions.remove(Kind.TRACKS, trackLineupEntry.uid))
    }
  })
}

export default function sagas() {
  const trackSagas = new TracksSagas().getSagas()
  return trackSagas.concat([watchSetArtistPick, watchDeleteTrack])
}
