import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheSelectors,
  CommonState,
  getContext,
  cacheCollectionsActions,
  reformatCollection
} from '@audius/common'
import {
  Kind,
  CollectionMetadata,
  Collection,
  UserCollectionMetadata,
  ID
} from '@audius/common/models'
import { makeUid, Nullable } from '@audius/common/utils'
import { chunk } from 'lodash'
import { all, call, select, put } from 'typed-redux-saga'

import { retrieve } from 'common/store/cache/sagas'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { waitForRead } from 'utils/sagaHelpers'

import { addTracksFromCollections } from './addTracksFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'

const { getEntryTimestamp } = cacheSelectors
const { getCollections } = cacheCollectionsSelectors
const { setPermalink } = cacheCollectionsActions
const getUserId = accountSelectors.getUserId

// Attempting to fetch more than this amount at once could result in a 400
// due to the URL being too long.
const COLLECTIONS_BATCH_LIMIT = 50
const TRACKS_BATCH_LIMIT = 200

function* markCollectionDeleted(
  collectionMetadatas: CollectionMetadata[]
): Generator<any, CollectionMetadata[], any> {
  const collections = yield* select(getCollections, {
    ids: collectionMetadatas.map((c) => c.playlist_id)
  })
  return collectionMetadatas.map((metadata) => {
    if (!(metadata.playlist_id in collections)) return metadata
    return {
      ...metadata,
      _marked_deleted: !!collections[metadata.playlist_id]._marked_deleted
    }
  })
}

export function* retrieveTracksForCollections(
  collections: CollectionMetadata[],
  excludedTrackIdSet: Set<ID>
) {
  const allTrackIds = collections.reduce((acc, cur) => {
    const trackIds = cur.playlist_contents.track_ids.map((t) => t.track)
    return [...acc, ...trackIds]
  }, [] as ID[])
  const filteredTrackIds = [
    ...new Set(allTrackIds.filter((id) => !excludedTrackIdSet.has(id)))
  ]
  const chunkedTracks = yield* all(
    chunk(filteredTrackIds, TRACKS_BATCH_LIMIT).map((chunkedTrackIds) =>
      call(retrieveTracks, {
        trackIds: chunkedTrackIds
      })
    )
  )

  const tracks = chunkedTracks.flat(1)

  // If any tracks failed to be retrieved for some reason,
  // remove them from their collection.
  const unfetchedIdSet = new Set()
  for (let i = 0; i < tracks.length; i++) {
    if (!tracks[i]) {
      unfetchedIdSet.add(filteredTrackIds[i])
    }
  }

  return collections.map((c) => {
    // Filter out unfetched tracks
    const filteredIds = c.playlist_contents.track_ids.filter(
      (t) => !unfetchedIdSet.has(t.track)
    )
    // Add UIDs
    const withUids = filteredIds.map((t) => ({
      ...t,
      // Make a new UID if one doesn't already exist
      uid: t.uid || makeUid(Kind.TRACKS, t.track, `collection:${c.playlist_id}`)
    }))

    return {
      ...c,
      playlist_contents: {
        track_ids: withUids
      }
    }
  })
}

type retrieveCollectionArgs = {
  playlistId?: Nullable<ID>
  permalink?: Nullable<string>
}

/**
 * Retrieves a single collection via API client
 */
export function* retrieveCollection({
  playlistId,
  permalink
}: retrieveCollectionArgs) {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const currentUserId = yield* select(getUserId)
  if (permalink) {
    const playlists = yield* call([apiClient, 'getPlaylistByPermalink'], {
      currentUserId,
      permalink
    })
    return playlists
  }
  if (playlistId) {
    const playlists = yield* call([apiClient, 'getPlaylist'], {
      currentUserId,
      playlistId
    })
    return playlists
  }
  return []
}

function* selectEntriesTimestamp(ids: (ID | string)[]) {
  const entriesTimestamps = (state: CommonState, ids: (ID | string)[]) =>
    ids.reduce(
      (acc: { [id: number | string]: number | null }, id: ID | string) => {
        acc[id] = getEntryTimestamp(state, { kind: Kind.COLLECTIONS, id })
        return acc
      },
      {}
    )
  const selectedEntries = yield* select(entriesTimestamps, ids)
  return selectedEntries
}

export function* retrieveCollectionByPermalink(
  permalink: string,
  config?: RetrieveCollectionsConfig
) {
  const {
    fetchTracks = false,
    requiresAllTracks = false,
    forceRetrieveFromSource = false,
    deleteExistingEntry
  } = config ?? {}
  // @ts-ignore retrieve should be refactored to ts first
  const { entries, uids } = yield* call(retrieve, {
    ids: [permalink],
    selectFromCache: function* (permalinks: string[]) {
      const cachedCollections = yield* select(
        cacheCollectionsSelectors.getCollections,
        {
          permalinks
        }
      )
      if (requiresAllTracks) {
        const keys = Object.keys(cachedCollections) as unknown as number[]
        keys.forEach((collectionId) => {
          const fullTrackCount = cachedCollections[collectionId].track_count
          const currentTrackCount =
            cachedCollections[collectionId].tracks?.length ?? 0
          if (currentTrackCount < fullTrackCount) {
            // Remove the collection from the res so retrieve knows to get it from source
            delete cachedCollections[collectionId]
          }
        })
      }
      return cachedCollections
    },
    getEntriesTimestamp: selectEntriesTimestamp,
    retrieveFromSource: function* (permalinks: string[]) {
      const metadatas = yield* call(retrieveCollection, {
        permalink: permalinks[0]
      })

      // Process any local deletions on the client
      const metadatasWithDeleted = yield* call(markCollectionDeleted, metadatas)

      return metadatasWithDeleted
    },
    onBeforeAddToCache: function* (collections: UserCollectionMetadata[]) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      yield* addUsersFromCollections(collections)
      yield* addTracksFromCollections(collections)

      const [collection] = collections

      const isLegacyPermalink = permalink !== collection.permalink
      if (isLegacyPermalink) {
        yield* put(setPermalink(permalink, collection.playlist_id))
      }

      if (fetchTracks) {
        yield* call(retrieveTracksForCollections, collections, new Set())
      }

      const reformattedCollections = collections.map((c) =>
        reformatCollection({ collection: c, audiusBackendInstance })
      )

      return reformattedCollections
    },
    kind: Kind.COLLECTIONS,
    idField: 'playlist_id',
    forceRetrieveFromSource,
    shouldSetLoading: true,
    deleteExistingEntry
  })

  return { collections: entries, uids }
}

export type RetrieveCollectionsConfig = {
  // whether or not to fetch the tracks inside eachn collection
  fetchTracks?: boolean
  // optional owner of collections to fetch (TODO: to be removed)
  userId?: ID | null
  /**  whether or not fetching this collection requires it to have all its tracks.
   * In the case where a collection is already cached with partial tracks, use this flag to refetch from source.
   */
  requiresAllTracks?: boolean
  forceRetrieveFromSource?: boolean
  deleteExistingEntry?: boolean
}
/**
 * Retrieves collections from the cache or from source. If requesting more than
 * `COLLECTIONS_BATCH_LIMIT`, will break API requests up into chunks.
 */
export function* retrieveCollections(
  collectionIds: ID[],
  config?: RetrieveCollectionsConfig
) {
  const {
    userId = null,
    fetchTracks = false,
    requiresAllTracks = false,
    forceRetrieveFromSource = false,
    deleteExistingEntry
  } = config ?? {}
  // @ts-ignore retrieve should be refactored to ts first
  const { entries, uids } = yield* call(retrieve, {
    ids: collectionIds,
    selectFromCache: function* (ids: ID[]) {
      const res: {
        [id: number]: Collection
      } = yield* select(getCollections, { ids })
      if (requiresAllTracks) {
        const keys = Object.keys(res) as any
        keys.forEach((collectionId: number) => {
          const fullTrackCount = res[collectionId].track_count
          const currentTrackCount = res[collectionId].tracks?.length ?? 0
          if (currentTrackCount < fullTrackCount) {
            // Remove the collection from the res so retrieve knows to get it from source
            delete res[collectionId]
          }
        })
      }
      return res
    },
    getEntriesTimestamp: selectEntriesTimestamp,
    retrieveFromSource: function* (ids: ID[]) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      let metadatas: CollectionMetadata[]

      if (ids.length === 1) {
        metadatas = yield* call(retrieveCollection, { playlistId: ids[0] })
      } else {
        // TODO: Remove this branch when we have batched endpoints in new V1 api.
        // Request ids in chunks if we're asked for too many
        const chunks = yield* all(
          chunk(ids, COLLECTIONS_BATCH_LIMIT).map((chunkedCollectionIds) =>
            call(
              audiusBackendInstance.getPlaylists,
              userId,
              chunkedCollectionIds
            )
          )
        )
        metadatas = chunks.flat()
      }

      // Process any local deletions on the client
      const metadatasWithDeleted = yield* call(markCollectionDeleted, metadatas)

      return metadatasWithDeleted
    },
    onBeforeAddToCache: function* (metadatas: UserCollectionMetadata[]) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      yield* addUsersFromCollections(metadatas)
      yield* addTracksFromCollections(metadatas)

      if (fetchTracks) {
        yield* call(retrieveTracksForCollections, metadatas, new Set())
      }

      const reformattedCollections = metadatas.map((c) =>
        reformatCollection({ collection: c, audiusBackendInstance })
      )

      return reformattedCollections
    },
    kind: Kind.COLLECTIONS,
    idField: 'playlist_id',
    forceRetrieveFromSource,
    shouldSetLoading: true,
    deleteExistingEntry
  })

  return { collections: entries, uids }
}
