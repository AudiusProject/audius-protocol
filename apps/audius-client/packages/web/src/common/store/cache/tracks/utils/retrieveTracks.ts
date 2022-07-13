import { spawn, call, select, put } from 'typed-redux-saga/macro'

import { ID } from 'common/models/Identifiers'
import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { Track, TrackMetadata, UserTrackMetadata } from 'common/models/Track'
import { CommonState } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { retrieve } from 'common/store/cache/sagas'
import { getEntryTimestamp } from 'common/store/cache/selectors'
import * as trackActions from 'common/store/cache/tracks/actions'
import { getTracks as getTracksSelector } from 'common/store/cache/tracks/selectors'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import { setTracksIsBlocked } from './blocklist'
import {
  fetchAndProcessRemixes,
  fetchAndProcessRemixParents
} from './fetchAndProcessRemixes'
import { fetchAndProcessStems } from './fetchAndProcessStems'
import { addUsersFromTracks } from './helpers'
import { reformat } from './reformat'

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
}

export function* retrieveTrackByHandleAndSlug({
  handle,
  slug,
  withStems,
  withRemixes,
  withRemixParents
}: RetrieveTrackByHandleAndSlugArgs) {
  const permalink = `/${handle}/${slug}`
  const tracks: { entries: { [permalink: string]: Track } } = yield* call(
    // @ts-ignore retrieve should be refactored to ts first
    retrieve,
    {
      ids: [permalink],
      selectFromCache: function* (permalinks: string[]) {
        const track = yield* select(getTracksSelector, {
          permalinks
        })
        return track
      },
      retrieveFromSource: function* (permalinks: string[]) {
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
      forceRetrieveFromSource: false,
      shouldSetLoading: true,
      deleteExistingEntry: false,
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
        yield* addUsersFromTracks(tracks)
        yield* put(
          trackActions.setPermalinkStatus([
            {
              permalink,
              id: tracks[0].track_id,
              status: Status.SUCCESS
            }
          ])
        )
        const checkedTracks = yield* call(setTracksIsBlocked, tracks)
        return checkedTracks.map(reformat)
      }
    }
  )
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
  const currentUserId: number | null = yield* select(getUserId)

  // In the case of unlisted tracks, trackIds contains metadata used to fetch tracks
  const ids = canBeUnlisted
    ? (trackIds as UnlistedTrackRequest[]).map(({ id }) => id)
    : (trackIds as ID[])

  if (canBeUnlisted && withStems) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Stems endpoint only supports fetching single tracks')
        return
      }
      const trackId = ids[0]
      if (!trackId) return
      yield* call(fetchAndProcessStems, trackId)
    })
  }

  if (withRemixes) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn('Remixes endpoint only supports fetching single tracks')
        return
      }
      const trackId = ids[0]
      if (!trackId) return
      yield* call(fetchAndProcessRemixes, trackId)
    })
  }

  if (withRemixParents) {
    yield* spawn(function* () {
      if (ids.length > 1) {
        console.warn(
          'Remix parents endpoint only supports fetching single tracks'
        )
        return
      }
      const trackId = ids[0]
      if (!trackId) return
      yield* call(fetchAndProcessRemixParents, trackId)
    })
  }

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
      let fetched: UserTrackMetadata | UserTrackMetadata[] | null | undefined
      if (canBeUnlisted) {
        const ids = trackIds as UnlistedTrackRequest[]
        // TODO: remove the AudiusBackend
        // branches here when we support
        // bulk track fetches in the API.
        if (ids.length > 1) {
          fetched = yield* call(
            AudiusBackend.getTracksIncludingUnlisted,
            trackIds as UnlistedTrackRequest[]
          )
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
          fetched = yield* call(AudiusBackend.getAllTracks, {
            offset: 0,
            limit: ids.length,
            idsArray: ids as ID[]
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
      yield* addUsersFromTracks(tracks)
      const checkedTracks = yield* call(setTracksIsBlocked, tracks)
      return checkedTracks.map(reformat)
    }
  })

  return ids.map((id) => tracks.entries[id]).filter(Boolean)
}
