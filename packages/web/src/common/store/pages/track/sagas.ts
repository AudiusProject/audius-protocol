import { Kind, LineupEntry, Track } from '@audius/common/models'
import {
  cacheTracksActions as trackCacheActions,
  cacheTracksSelectors,
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  cacheUsersSelectors
} from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'typed-redux-saga'

import trackLineupSagas from './lineups/sagas'

const { tracksActions } = trackPageLineupActions
const { getTrackId, getSourceSelector } = trackPageSelectors
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

function* addTrackToLineup(track: Track) {
  const source = yield* select(getSourceSelector)
  const formattedTrack: LineupEntry<Track> = {
    kind: Kind.TRACKS,
    id: track.track_id,
    uid: makeUid(Kind.TRACKS, track.track_id, source),
    ...track
  }

  yield* put(tracksActions.add(formattedTrack, track.track_id))
}

/** Get "more by this artist" and put into the lineup + queue */
function* getRestOfLineup(permalink: string, ownerHandle: string) {
  yield* put(
    tracksActions.fetchLineupMetadatas(1, 5, false, {
      ownerHandle,
      heroTrackPermalink: permalink
    })
  )
}

function* watchFetchTrackSucceeded() {
  yield* takeEvery(
    trackPageActions.FETCH_TRACK_SUCCEEDED,
    function* (action: trackPageActions.FetchTrackSucceededAction) {
      const { trackId } = action

      const track = yield* select(getTrack, { id: trackId })
      if (!track) return
      const { permalink, owner_id } = track

      const owner = yield* select(getUser, { id: owner_id })
      if (!owner) return

      yield* put(trackPageActions.setTrackId(trackId))
      yield* put(trackPageActions.setTrackPermalink(permalink))

      // Add hero track to lineup early so that we can play it ASAP
      // (instead of waiting for the entire lineup to load)
      yield* call(addTrackToLineup, track)
      yield* fork(getRestOfLineup, track.permalink, owner?.handle)
    }
  )
}

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
  return [
    ...trackLineupSagas(),
    watchFetchTrackSucceeded,
    watchRefetchLineup,
    watchTrackPageMakePublic
  ]
}
