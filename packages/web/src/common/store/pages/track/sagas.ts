import { Track } from '@audius/common/models'
import {
  cacheTracksActions as trackCacheActions,
  cacheTracksSelectors,
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  cacheUsersSelectors
} from '@audius/common/store'
import moment from 'moment'
import { put, select, takeEvery } from 'typed-redux-saga'

import trackLineupSagas from './lineups/sagas'

const { tracksActions } = trackPageLineupActions
const { getTrackId } = trackPageSelectors
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

function* watchRefetchLineup() {
  yield* takeEvery(trackPageActions.REFETCH_LINEUP, function* (action) {
    const trackId = yield* select(getTrackId)
    const track = yield* select(getTrack, { id: trackId })
    const user = yield* select(getUser, { id: track?.owner_id })

    yield* put(tracksActions.reset())
    yield* put(
      tracksActions.fetchLineupMetadatas(0, 6, false, {
        ownerHandle: user?.handle,
        heroTrackPermalink: track?.permalink
      })
    )
  })
}

function* watchTrackPageMakePublic() {
  yield* takeEvery(
    trackPageActions.MAKE_TRACK_PUBLIC,
    function* (action: ReturnType<typeof trackPageActions.makeTrackPublic>) {
      const { trackId } = action
      let track: Track | null = yield* select(getTrack, { id: trackId })

      if (!track) return
      track = {
        ...track,
        is_unlisted: false,
        release_date: moment().toString(),
        is_scheduled_release: false,
        field_visibility: {
          genre: true,
          mood: true,
          tags: true,
          share: true,
          play_count: true,
          remixes: track?.field_visibility?.remixes ?? true
        }
      }

      yield* put(trackCacheActions.editTrack(trackId, track))
    }
  )
}

export default function sagas() {
  return [...trackLineupSagas(), watchRefetchLineup, watchTrackPageMakePublic]
}
