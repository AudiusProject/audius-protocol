import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '@audius/common/adapters'
import { playlistPermalinkToHandleAndSlug } from '@audius/common/api'
import {
  Kind,
  CollectionMetadata,
  Collection,
  UserCollectionMetadata,
  ID,
  Id,
  OptionalId
} from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  cacheSelectors,
  reformatCollection,
  getContext,
  CommonState,
  getSDK
} from '@audius/common/store'
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
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)
  if (permalink) {
    const { handle, slug } = playlistPermalinkToHandleAndSlug(permalink)
    const { data = [] } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getPlaylistByHandleAndSlug],
      { handle, slug, userId: OptionalId.parse(currentUserId) }
    )
    return transformAndCleanList(data, userCollectionMetadataFromSDK)
  }
  if (playlistId) {
    const { data = [] } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getPlaylist],
      {
        playlistId: Id.parse(playlistId),
        userId: OptionalId.parse(currentUserId)
      }
    )
    return transformAndCleanList(data, userCollectionMetadataFromSDK)
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
    forceRetrieveFromSource = false,
    deleteExistingEntry
  } = config ?? {}
  // @ts-ignore retrieve should be refactored to ts first
  const { entries, uids } = yield* call(retrieve, {
    ids: [permalink],
    selectFromCache: function* (permalinks: string[]) {
      return yield* select(cacheCollectionsSelectors.getCollections, {
        permalinks
      })
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
    forceRetrieveFromSource = false,
    deleteExistingEntry
  } = config ?? {}
  // @ts-ignore retrieve should be refactored to ts first
  const { entries, uids } = yield* call(retrieve<Collection>, {
    ids: collectionIds,
    selectFromCache: function* (ids: ID[]) {
      return yield* select(getCollections, { ids })
    },
    getEntriesTimestamp: selectEntriesTimestamp,
    retrieveFromSource: function* (ids: ID[]) {
      const audiusSdk = yield* getContext('audiusSdk')
      const sdk = yield* call(audiusSdk)
      let metadatas: CollectionMetadata[]

      if (ids.length === 1) {
        const { data = [] } = yield* call(
          [sdk.full.playlists, sdk.full.playlists.getPlaylist],
          {
            playlistId: Id.parse(ids[0]),
            userId: OptionalId.parse(userId)
          }
        )
        const [collection] = transformAndCleanList(
          data,
          userCollectionMetadataFromSDK
        )
        metadatas = [collection]
      } else {
        const { data = [] } = yield* call(
          [sdk.full.playlists, sdk.full.playlists.getBulkPlaylists],
          {
            id: ids.map((id) => Id.parse(id)),
            userId: OptionalId.parse(userId)
          }
        )
        metadatas = transformAndCleanList(data, userCollectionMetadataFromSDK)
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
