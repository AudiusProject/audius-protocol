import { call, select } from 'redux-saga/effects'
import AudiusBackend from 'services/AudiusBackend'

import {
  PREFIX,
  tracksActions
} from 'containers/track-page/store/lineups/tracks/actions'
import {
  getSourceSelector as sourceSelector,
  getLineup
} from 'containers/track-page/store/selectors'
import { getUserFromTrack } from 'store/cache/users/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { getTrack } from 'store/cache/tracks/selectors'
import { waitForValue } from 'utils/sagaHelpers'

function* getTracks({ offset, limit, payload }) {
  const { trackId } = payload

  const user = yield select(getUserFromTrack, { id: trackId })

  const tracks = yield call(AudiusBackend.getArtistTracks, {
    offset,
    limit,
    userId: user.user_id,
    filterDeleted: true
  })
  const processed = yield call(processAndCacheTracks, tracks)

  // Add the hero track into the lineup so that the queue can pull directly from the lineup
  // TODO: Create better ad-hoc add to queue methods and use that instead of this
  const track = yield select(getTrack, { id: trackId })
  const lineup = [track]

  const remixParentTrackId = track._remix_parents?.[0]?.track_id
  if (remixParentTrackId) {
    const remixParentTrack = yield call(waitForValue, getTrack, {
      id: remixParentTrackId
    })
    lineup.push(remixParentTrack)
  }

  return lineup.concat(
    processed
      // Filter out any track that happens to be the hero track
      // or is deleted or is the remix parent track.
      .filter(
        t =>
          t.track_id !== trackId &&
          t.track_id !== remixParentTrackId &&
          !t.is_delete
      )
      // Sort by play count desc
      .sort((a, b) => b.play_count - a.play_count)
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
