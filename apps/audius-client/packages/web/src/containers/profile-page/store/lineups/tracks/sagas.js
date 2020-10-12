import { all, call, select, takeEvery, put } from 'redux-saga/effects'

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
import { tracksActions as lineupActions } from './actions'
import { SET_ARTIST_PICK } from 'store/social/tracks/actions'
import { retrieveTracks } from 'store/cache/tracks/utils'

import { getUserId } from 'store/account/selectors'
import { retrieveUserTracks } from './retrieveUserTracks'
import { waitForValue } from 'utils/sagaHelpers'
import { getUser } from 'store/cache/users/selectors'
import { TracksSortMode } from '../../types'

function* getTracks({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
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
    user => 'twitter_handle' in user
  )
  const sort = payload.sort === TracksSortMode.POPULAR ? 'plays' : 'date'

  if (user._artist_pick) {
    let [pinnedTrack, processed] = yield all([
      call(retrieveTracks, { trackIds: [user._artist_pick] }),
      call(retrieveUserTracks, {
        handle,
        currentUserId,
        sort,
        limit,
        offset
      })
    ])

    // Pinned tracks *should* be unpinned
    // when deleted, but just in case they're not,
    // defend against that edge case here.
    if (!pinnedTrack.length || pinnedTrack[0].is_delete) {
      pinnedTrack = []
    }

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
    const processed = yield call(retrieveUserTracks, {
      handle,
      currentUserId,
      sort,
      limit,
      offset
    })
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
