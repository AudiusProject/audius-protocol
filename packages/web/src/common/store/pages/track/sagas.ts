import { Kind, LineupEntry, Track } from '@audius/common/models'
import {
  cacheTracksActions as trackCacheActions,
  cacheTracksSelectors,
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  reachabilitySelectors
} from '@audius/common/store'
import { makeUid, route } from '@audius/common/utils'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'typed-redux-saga'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import { push as pushRoute } from 'utils/navigation'

import tracksSagas from './lineups/sagas'
const { getIsReachable } = reachabilitySelectors
const { tracksActions } = trackPageLineupActions
const { getSourceSelector, getTrack, getUser } = trackPageSelectors
const { getTrack: getCachedTrack } = cacheTracksSelectors
const { NOT_FOUND_PAGE } = route

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

function* watchFetchTrack() {
  yield* takeEvery(
    trackPageActions.FETCH_TRACK,
    function* (action: ReturnType<typeof trackPageActions.fetchTrack>) {
      const {
        trackId,
        handle,
        slug,
        canBeUnlisted,
        forceRetrieveFromSource,
        withRemixes = true
      } = action
      try {
        let track
        if (!trackId) {
          if (!(handle && slug)) return
          track = yield* call(retrieveTrackByHandleAndSlug, {
            handle,
            slug,
            withStems: true,
            withRemixes,
            withRemixParents: true,
            forceRetrieveFromSource
          })
        } else {
          const ids = canBeUnlisted
            ? [{ id: trackId, url_title: slug, handle }]
            : [trackId]

          const tracks: Track[] = yield* call(retrieveTracks, {
            trackIds: ids,
            canBeUnlisted,
            withStems: true,
            withRemixes,
            withRemixParents: true
          })
          track = tracks && tracks.length === 1 ? tracks[0] : null
        }
        const isReachable = yield* select(getIsReachable)
        if (!track) {
          if (isReachable) {
            yield* put(pushRoute(NOT_FOUND_PAGE))
          }
        } else {
          yield* put(trackPageActions.setTrackId(track.track_id))
          // Add hero track to lineup early so that we can play it ASAP
          // (instead of waiting for the entire lineup to load)
          yield* call(addTrackToLineup, track)
          if (isReachable) {
            yield* fork(
              getRestOfLineup,
              track.permalink,
              handle || track.permalink.split('/')?.[1]
            )
          }
          yield* put(trackPageActions.fetchTrackSucceeded(track.track_id))
        }
      } catch (e) {
        console.error(e)
        yield* put(
          trackPageActions.fetchTrackFailed(trackId ?? `/${handle}/${slug}`)
        )
      }
    }
  )
}

function* watchRefetchLineup() {
  yield* takeEvery(trackPageActions.REFETCH_LINEUP, function* (action) {
    const track = yield* select(getTrack)
    const user = yield* select(getUser)
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
      let track: Track | null = yield* select(getCachedTrack, { id: trackId })

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
    ...tracksSagas(),
    watchFetchTrack,
    watchRefetchLineup,
    watchTrackPageMakePublic
  ]
}
