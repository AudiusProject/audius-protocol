import { trendingIdsFromSDK } from '@audius/common/adapters'
import { ID, Kind, LineupEntry, Track } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  cacheTracksActions as trackCacheActions,
  cacheTracksSelectors,
  trackPageLineupActions,
  trackPageActions,
  getContext,
  trackPageSelectors,
  reachabilitySelectors,
  TrackPageState,
  getSDK
} from '@audius/common/store'
import { makeUid, route } from '@audius/common/utils'
import { push as pushRoute } from 'utils/navigation'
import { keccak_256 } from 'js-sha3'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'typed-redux-saga'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import { waitForRead } from 'utils/sagaHelpers'

import tracksSagas from './lineups/sagas'
const { getIsReachable } = reachabilitySelectors
const { tracksActions } = trackPageLineupActions
const { getSourceSelector, getTrack, getTrendingTrackRanks, getUser } =
  trackPageSelectors
const { getTrack: getCachedTrack } = cacheTracksSelectors
const { NOT_FOUND_PAGE } = route

export const TRENDING_BADGE_LIMIT = 10

function* watchFetchTrackBadge() {
  const sdk = yield* getSDK()
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield* takeEvery(
    trackPageActions.GET_TRACK_RANKS,
    function* (action: ReturnType<typeof trackPageActions.getTrackRanks>) {
      try {
        yield* call(waitForRead)
        yield* call(remoteConfigInstance.waitForRemoteConfig)
        const TF = new Set(
          remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
        )
        const version = remoteConfigInstance.getRemoteVar(
          StringKeys.TRENDING_EXPERIMENT
        )
        let trendingTrackRanks: TrackPageState['trendingTrackRanks'] | null =
          yield* select(getTrendingTrackRanks)
        if (!trendingTrackRanks) {
          const { data } = version
            ? yield* call(
                [
                  sdk.full.tracks,
                  sdk.full.tracks.getTrendingTracksIDsWithVersion
                ],
                { version }
              )
            : yield* call(
                [sdk.full.tracks, sdk.full.tracks.getTrendingTrackIDs],
                {}
              )
          const trendingRanks = trendingIdsFromSDK(data)
          if (TF.size > 0) {
            trendingRanks.week = trendingRanks.week.filter((i) => {
              const shaId = keccak_256(i.toString())
              return !TF.has(shaId)
            })
            trendingRanks.month = trendingRanks.month.filter((i) => {
              const shaId = keccak_256(i.toString())
              return !TF.has(shaId)
            })
            trendingRanks.year = trendingRanks.year.filter((i) => {
              const shaId = keccak_256(i.toString())
              return !TF.has(shaId)
            })
          }

          yield* put(trackPageActions.setTrackTrendingRanks(trendingRanks))
          trendingTrackRanks = yield* select(getTrendingTrackRanks)
        }

        const weeklyTrackIndex =
          trendingTrackRanks?.week?.findIndex(
            (trackId) => trackId === action.trackId
          ) ?? -1
        const monthlyTrackIndex =
          trendingTrackRanks?.month?.findIndex(
            (trackId) => trackId === action.trackId
          ) ?? -1
        const yearlyTrackIndex =
          trendingTrackRanks?.year?.findIndex(
            (trackId) => trackId === action.trackId
          ) ?? -1

        yield* put(
          trackPageActions.setTrackRank(
            'week',
            weeklyTrackIndex !== -1 ? weeklyTrackIndex + 1 : null
          )
        )
        yield* put(
          trackPageActions.setTrackRank(
            'month',
            monthlyTrackIndex !== -1 ? monthlyTrackIndex + 1 : null
          )
        )
        yield* put(
          trackPageActions.setTrackRank(
            'year',
            yearlyTrackIndex !== -1 ? yearlyTrackIndex + 1 : null
          )
        )
      } catch (error: any) {
        console.error(`Unable to fetch track badge: ${error.message}`)
      }
    }
  )
}

function* getTrackRanks(trackId: ID) {
  yield* put(trackPageActions.getTrackRanks(trackId))
}

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
            yield* fork(getTrackRanks, track.track_id)
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
    watchFetchTrackBadge,
    watchTrackPageMakePublic
  ]
}
