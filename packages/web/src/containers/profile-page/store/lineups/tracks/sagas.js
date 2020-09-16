import { all, call, select, takeEvery, put } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import {
  PREFIX,
  tracksActions
} from 'containers/profile-page/store/lineups/tracks/actions'
import {
  getProfileUserId,
  getProfileTracksLineup,
  getProfileUserHandle
} from 'containers/profile-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { getTrack } from 'store/cache/tracks/selectors'
import { fetchUserByHandle } from 'store/cache/users/sagas'
import { tracksActions as lineupActions } from './actions'
import { SET_ARTIST_PICK } from 'store/social/tracks/actions'
import { retrieveTracks, processAndCacheTracks } from 'store/cache/tracks/utils'

import { TracksSortMode } from 'containers/profile-page/store/types'

const sortByTime = 'created_at:desc,track_id:desc'

const userTracks = {
  userId: '',
  tracks: []
}

const getSortedTracks = async ({ offset, limit, payload, user }) => {
  if (payload.sort === TracksSortMode.POPULAR) {
    if (user.user_id === userTracks.userId && offset !== 0) {
      return userTracks.tracks.slice(offset, limit + offset)
    }
    // Get All artist Tracks
    // For all tracks, get listen_count
    const tracks = await AudiusBackend.getArtistTracks({
      offset: 0,
      limit: user.track_count,
      userId: user.user_id,
      filterDeleted: true
    })

    const sortedPopularTracks = tracks
      .filter(t => !t.is_delete)
      // Sort by listen count desc
      .sort((a, b) => b.play_count - a.play_count)

    userTracks.userId = user.user_id
    userTracks.tracks = sortedPopularTracks

    return sortedPopularTracks.slice(offset, offset + limit)
  } else {
    return AudiusBackend.getArtistTracks({
      offset,
      limit,
      userId: payload.userId,
      sort: sortByTime,
      filterDeleted: true
    })
  }
}

function* getTracks({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const user = yield call(fetchUserByHandle, handle, new Set(['_artist_pick']))
  // If the artist has pinned a track, retrieve the pinned track and merge the response with
  // the query for the arist tracks.

  if (user._artist_pick) {
    let [pinnedTrack, trackResponse] = yield all([
      call(retrieveTracks, { trackIds: [user._artist_pick] }),
      call(getSortedTracks, { offset, limit, payload, user })
    ])

    // Pinned tracks *should* be unpinned
    // when deleted, but just in case they're not,
    // defend against that edge case here.
    if (pinnedTrack[0].is_delete) {
      pinnedTrack = []
    }

    const processed = yield call(processAndCacheTracks, trackResponse)
    const pinnedTrackIndex = processed.findIndex(
      track => track.track_id === user._artist_pick
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
      // just slice out the pinned track because
      // we already have it.
      if (pinnedTrackIndex !== -1) {
        return processed
          .slice(0, pinnedTrackIndex)
          .concat(processed.slice(pinnedTrackIndex + 1))
      }
      return processed
    }
  } else {
    const trackResponse = yield call(getSortedTracks, {
      offset,
      limit,
      payload,
      user
    })
    const processed = yield call(processAndCacheTracks, trackResponse)
    return processed
  }
}

const sourceSelector = state => `${PREFIX}:${getProfileUserId(state)}`

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

export default function sagas() {
  const trackSagas = new TracksSagas().getSagas()
  return trackSagas.concat([watchSetArtistPick])
}
