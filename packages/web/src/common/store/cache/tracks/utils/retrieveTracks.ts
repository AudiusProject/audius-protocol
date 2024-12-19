import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import {
  Kind,
  ID,
  TrackMetadata,
  Track,
  UserTrackMetadata,
  Id,
  OptionalId
} from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksActions,
  cacheTracksSelectors,
  cacheSelectors,
  CommonState,
  getSDK
} from '@audius/common/store'
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

type UnlistedTrackRequest = {
  id: ID
  // TODO: These are no longer required for unlisted track fetching
  // They are only optional for a request for an unlisted track and can be
  // traced through and deleted.
  url_title?: string
  handle?: string
}
type RetrieveTracksArgs = {
  trackIds: ID[] | UnlistedTrackRequest[]
  /** deprecated */
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
      const sdk = yield* getSDK()
      const userId = yield* select(getUserId)
      const { data } = yield* call(
        [sdk.full.tracks, sdk.full.tracks.getBulkTracks],
        { permalink: permalinks, userId: OptionalId.parse(userId) }
      )
      return data ? userTrackMetadataFromSDK(data[0]) : null
    },
    kind: Kind.TRACKS,
    idField: 'track_id',
    // If this is the first fetch after server side rendering the track page,
    // force retrieve from source to ensure we have personalized data
    forceRetrieveFromSource,
    shouldSetLoading: true,
    deleteExistingEntry: false,
    getEntriesTimestamp: function* (ids: ID[]) {
      const selected = yield* select(
        (state: CommonState, ids: ID[]) =>
          ids.reduce(
            (acc, id) => {
              acc[id] = getEntryTimestamp(state, { kind: Kind.TRACKS, id })
              return acc
            },
            {} as { [id: number]: number | null }
          ),
        ids
      )
      return selected
    },
    onBeforeAddToCache: function* (tracks: TrackMetadata[]) {
      yield* addUsersFromTracks(tracks)
      const [track] = tracks
      const isLegacyPermalink = track.permalink !== permalink
      if (isLegacyPermalink) {
        yield* put(setPermalink(permalink, track.track_id))
      }
      return tracks.map((track) => reformat(track))
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
  yield* call(waitForRead)
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
          ids.reduce(
            (acc, id) => {
              acc[id] = getEntryTimestamp(state, { kind: Kind.TRACKS, id })
              return acc
            },
            {} as { [id: number]: number | null }
          ),
        ids
      )
      return selected
    },
    retrieveFromSource: function* (ids: ID[] | UnlistedTrackRequest[]) {
      yield* waitForRead()
      const sdk = yield* getSDK()
      let fetched: UserTrackMetadata | UserTrackMetadata[] | null | undefined

      if (canBeUnlisted) {
        const ids = trackIds as UnlistedTrackRequest[]
        if (ids.length > 1) {
          throw new Error('Can only query for single unlisted track')
        } else {
          const { id } = ids[0]

          const { data } = yield* call(
            [sdk.full.tracks, sdk.full.tracks.getTrack],
            { trackId: Id.parse(id), userId: OptionalId.parse(currentUserId) }
          )

          fetched = data ? userTrackMetadataFromSDK(data) : null
        }
      } else {
        const ids = trackIds as number[]
        if (ids.length > 1) {
          const { data = [] } = yield* call(
            [sdk.full.tracks, sdk.full.tracks.getBulkTracks],
            {
              id: ids.map((id) => Id.parse(id)),
              userId: OptionalId.parse(currentUserId)
            }
          )
          fetched = transformAndCleanList(data, userTrackMetadataFromSDK)
        } else {
          const { data } = yield* call(
            [sdk.full.tracks, sdk.full.tracks.getTrack],
            {
              trackId: Id.parse(ids[0]),
              userId: OptionalId.parse(currentUserId)
            }
          )

          fetched = data ? userTrackMetadataFromSDK(data) : null
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
      yield* addUsersFromTracks(tracks)
      return tracks.map((track) => reformat(track))
    }
  })

  const trackId = ids[0]
  const track = tracks.entries[trackId]

  if (withStems) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.error('Stems endpoint only supports fetching single tracks')
        return
      }
      yield* call(fetchAndProcessStems, trackId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.error('Remixes endpoint only supports fetching single tracks')
        return
      }
      yield* call(fetchAndProcessRemixes, trackId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      if (ids.length > 1 && track) {
        console.error(
          'Remix parents endpoint only supports fetching single tracks'
        )
        return
      }
      yield* call(fetchAndProcessRemixParents, trackId)
    })
  }

  return ids.map((id) => tracks.entries[id]).filter(Boolean)
}
