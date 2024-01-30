import {
  ID,
  Kind,
  Track,
  TrackMetadata,
  UserTrackMetadata,
  accountSelectors,
  CommonState,
  getContext,
  cacheSelectors,
  cacheTracksSelectors,
  cacheTracksActions,
  trackPageSelectors,
  trackPageActions
} from '@audius/common'
import { call, put, select, spawn } from 'typed-redux-saga'

import { retrieve } from 'common/store/cache/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import {
  fetchAndProcessRemixes,
  fetchAndProcessRemixParents
} from './fetchAndProcessRemixes'
import { fetchAndProcessStems } from './fetchAndProcessStems'
import { addUsersFromTracks } from './helpers'
import { reformat } from './reformat'
const { getEntryTimestamp } = cacheSelectors
const { getTracks: getTracksSelector } = cacheTracksSelectors
const { setPermalink } = cacheTracksActions
const getUserId = accountSelectors.getUserId
const { getIsInitialFetchAfterSsr } = trackPageSelectors
const { setIsInitialFetchAfterSsr } = trackPageActions

type UnlistedTrackRequest = { id: ID; url_title: string; handle: string }
type RetrieveTracksArgs = {
  trackIds: ID[] | UnlistedTrackRequest[]
  canBeUnlisted?: boolean
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
  forceRetrieveFromSource?: boolean
}
type RetrieveTrackByHandleAndSlugArgs = {
  handle: string
  slug: string
  withStems?: boolean
  withRemixes?: boolean
  withRemixParents?: boolean
  forceRetrieveFromSource?: boolean
}

export function* retrieveTrackByHandleAndSlug({
  handle,
  slug,
  withStems,
  withRemixes,
  withRemixParents,
  forceRetrieveFromSource = false
}: RetrieveTrackByHandleAndSlugArgs) {
  const permalink = `/${handle}/${slug}`

  // Check if this is the first fetch after server side rendering the track page
  const isInitialFetchAfterSsr = yield* select(getIsInitialFetchAfterSsr)
  // @ts-ignore string IDs don't play well with the current retrieve typing
  const tracks = (yield* call(retrieve, {
    ids: [permalink],
    selectFromCache: function* (permalinks: string[]) {
      const track = yield* select(getTracksSelector, {
        permalinks
      })
      return track
    },
    retrieveFromSource: function* (permalinks: string[]) {
      yield* waitForRead()
      const apiClient = yield* getContext('apiClient')
      const userId = yield* select(getUserId)
      const track = yield* call((args) => {
        const split = args[0].split('/')
        const handle = split[1]
        const slug = split.slice(2).join('')
        return apiClient.getTrackByHandleAndSlug({
          handle,
          slug,
          currentUserId: userId
        })
      }, permalinks)
      return track
    },
    kind: Kind.TRACKS,
    idField: 'track_id',
    // If this is the first fetch after server side rendering the track page,
    // force retrieve from source to ensure we have personalized data
    forceRetrieveFromSource: forceRetrieveFromSource ?? isInitialFetchAfterSsr,
    shouldSetLoading: true,
    deleteExistingEntry: isInitialFetchAfterSsr,
    getEntriesTimestamp: function* (ids: ID[]) {
      const selected = yield* select(
        (state: CommonState, ids: ID[]) =>
          ids.reduce((acc, id) => {
            acc[id] = getEntryTimestamp(state, { kind: Kind.TRACKS, id })
            return acc
          }, {} as { [id: number]: number | null }),
        ids
      )
      return selected
    },
    onBeforeAddToCache: function* (tracks: TrackMetadata[]) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      yield* addUsersFromTracks(tracks, isInitialFetchAfterSsr)
      const [track] = tracks
      const isLegacyPermalink = track.permalink !== permalink
      if (isLegacyPermalink) {
        yield* put(setPermalink(permalink, track.track_id))
      }
      if (isInitialFetchAfterSsr) {
        yield* put(setIsInitialFetchAfterSsr(false))
      }
      return tracks.map((track) => reformat(track, audiusBackendInstance))
    }
  })) as { entries: { [permalink: string]: Track } }

  const track = tracks.entries[permalink]
  if (!track || !track.track_id) return null
  const trackId = track.track_id
  if (withStems) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessStems, trackId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixes, trackId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      yield* call(fetchAndProcessRemixParents, trackId)
    })
  }
  return track
}

/**
 * Retrieves tracks either from cache or from source.
 * Optionally:
 * - retrieves hiddenTracks.
 * - includes stems of a parent track.
 * - includes remixes of a parent track.
 * - includes the remix parents of a track.
 *
 * If retrieving unlisted tracks, request tracks as an array of `UnlistedTrackRequests.`
 */
export function* retrieveTracks({
  trackIds,
  canBeUnlisted = false,
  withStems = false,
  withRemixes = false,
  withRemixParents = false
}: RetrieveTracksArgs) {
  yield* waitForRead()
  const currentUserId = yield* select(getUserId)

  // In the case of unlisted tracks, trackIds contains metadata used to fetch tracks
  const ids = canBeUnlisted
    ? (trackIds as UnlistedTrackRequest[]).map(({ id }) => id)
    : (trackIds as ID[])

  // @ts-ignore retrieve should be refactored to ts first
  const tracks: { entries: { [id: number]: Track } } = yield* call(retrieve, {
    ids,
    selectFromCache: function* (ids: ID[]) {
      return yield* select(getTracksSelector, { ids })
    },
    getEntriesTimestamp: function* (ids: ID[]) {
      const selected = yield* select(
        (state: CommonState, ids: ID[]) =>
          ids.reduce((acc, id) => {
            acc[id] = getEntryTimestamp(state, { kind: Kind.TRACKS, id })
            return acc
          }, {} as { [id: number]: number | null }),
        ids
      )
      return selected
    },
    retrieveFromSource: function* (ids: ID[] | UnlistedTrackRequest[]) {
      yield* waitForRead()
      const apiClient = yield* getContext('apiClient')
      let fetched: UserTrackMetadata | UserTrackMetadata[] | null | undefined
      if (canBeUnlisted) {
        const ids = trackIds as UnlistedTrackRequest[]
        if (ids.length > 1) {
          throw new Error('Can only query for single unlisted track')
        } else {
          fetched = yield* call([apiClient, 'getTrack'], {
            id: ids[0].id,
            currentUserId,
            unlistedArgs: {
              urlTitle: ids[0].url_title,
              handle: ids[0].handle
            }
          })
        }
      } else {
        const ids = trackIds as number[]
        if (ids.length > 1) {
          fetched = yield* call([apiClient, 'getTracks'], {
            ids,
            currentUserId
          })
        } else {
          fetched = yield* call([apiClient, 'getTrack'], {
            id: ids[0],
            currentUserId
          })
        }
      }
      return fetched
    },
    kind: Kind.TRACKS,
    idField: 'track_id',
    forceRetrieveFromSource: false,
    shouldSetLoading: true,
    deleteExistingEntry: false,
    onBeforeAddToCache: function* <T extends TrackMetadata>(tracks: T[]) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      yield* addUsersFromTracks(tracks)
      return tracks.map((track) => reformat(track, audiusBackendInstance))
    }
  })

  const trackId = ids[0]
  const track = tracks.entries[trackId]

  if (canBeUnlisted && withStems) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.warn('Stems endpoint only supports fetching single tracks')
        return
      }
      yield* call(fetchAndProcessStems, trackId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.warn('Remixes endpoint only supports fetching single tracks')
        return
      }
      yield* call(fetchAndProcessRemixes, trackId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.warn(
          'Remix parents endpoint only supports fetching single tracks'
        )
        return
      }
      yield* call(fetchAndProcessRemixParents, trackId)
    })
  }

  return ids.map((id) => tracks.entries[id]).filter(Boolean)
}
