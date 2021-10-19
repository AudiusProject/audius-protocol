import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { retrieveUserTracks } from 'containers/profile-page/store/lineups/tracks/retrieveUserTracks'
import {
  PREFIX,
  tracksActions
} from 'containers/track-page/store/lineups/tracks/actions'
import {
  getSourceSelector as sourceSelector,
  getLineup
} from 'containers/track-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

function* getTracks({ offset, limit, payload }) {
  const { ownerHandle, permalink } = payload
  const currentUserId = yield select(getUserId)
  const processed = yield call(retrieveUserTracks, {
    handle: ownerHandle,
    currentUserId,
    sort: 'plays',
    limit: 6
  })

  // Add the hero track into the lineup so that the queue can pull directly from the lineup
  // TODO: Create better ad-hoc add to queue methods and use that instead of this
  const track = yield call(
    waitForValue,
    getTrack,
    { permalink },
    // Wait for the track to have a track_id (e.g. remix children could get fetched first)
    track => track.track_id
  )
  const lineup = [track]

  const remixParentTrackId = track.remix_of?.tracks?.[0]?.parent_track_id
  if (remixParentTrackId) {
    const remixParentTrack = yield call(waitForValue, getTrack, {
      id: remixParentTrackId
    })
    lineup.push(remixParentTrack)
  }

  return lineup.concat(
    processed
      // Filter out any track that happens to be the hero track
      // or is the remix parent track.
      .filter(
        t => t.permalink !== permalink && t.track_id !== remixParentTrackId
      )
      // Take only the first 5
      .slice(0, 5)
  )
}

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
