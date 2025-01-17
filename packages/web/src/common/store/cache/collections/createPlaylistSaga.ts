import {
  playlistMetadataForCreateWithSDK,
  userCollectionMetadataFromSDK
} from '@audius/common/adapters'
import {
  Name,
  Kind,
  CollectionMetadata,
  Collection,
  ID,
  Track
} from '@audius/common/models'
import { newCollectionMetadata } from '@audius/common/schemas'
import {
  accountActions,
  accountSelectors,
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheActions,
  reformatCollection,
  cacheUsersSelectors,
  confirmerActions,
  EditCollectionValues,
  RequestConfirmationError,
  getSDK
} from '@audius/common/store'
import { makeKindId, Nullable, route } from '@audius/common/utils'
import { Id, OptionalId } from '@audius/sdk'
import { call, put, select, takeLatest } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

const { getUser } = cacheUsersSelectors

const { requestConfirmation } = confirmerActions
const { getUserId, getAccountUser } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { collectionPage } = route

export function* createPlaylistSaga() {
  yield* takeLatest(
    cacheCollectionsActions.CREATE_PLAYLIST,
    createPlaylistWorker
  )
}

function* createPlaylistWorker(
  action: ReturnType<
    | typeof cacheCollectionsActions.createAlbum
    | typeof cacheCollectionsActions.createPlaylist
  >
) {
  yield* waitForWrite()
  const userId = yield* call(ensureLoggedIn)
  const {
    initTrackId,
    formFields,
    source,
    noticeType,
    isAlbum = false
  } = action
  const collection = newCollectionMetadata({ ...formFields, is_album: isAlbum })
  const sdk = yield* getSDK()
  const collectionId = yield* call([
    sdk.playlists,
    sdk.playlists.generatePlaylistId
  ])
  if (!collectionId) return

  const initTrack = yield* select(getTrack, { id: initTrackId })

  if (initTrack) {
    collection.cover_art_sizes = initTrack.cover_art_sizes
  }

  yield* call(optimisticallySavePlaylist, collectionId, collection, initTrack)
  yield* put(
    cacheCollectionsActions.createPlaylistRequested(
      collectionId,
      noticeType,
      isAlbum
    )
  )
  yield* call(
    createAndConfirmPlaylist,
    collectionId,
    userId,
    collection,
    initTrack,
    source,
    isAlbum
  )
}

function* optimisticallySavePlaylist(
  playlistId: ID,
  formFields: Partial<CollectionMetadata>,
  initTrack: Nullable<Track>
) {
  const accountUser = yield* select(getAccountUser)
  if (!accountUser) return
  const { user_id, handle, _collectionIds = [] } = accountUser
  const playlist: Partial<Collection> = {
    playlist_id: playlistId,
    ...formFields
  }

  const initTrackOwner = yield* select(getUser, { id: initTrack?.owner_id })

  playlist.playlist_owner_id = user_id
  playlist.is_private = true
  playlist.playlist_contents = {
    track_ids: initTrack
      ? [
          {
            time: Math.round(Date.now() / 1000), // must use seconds
            track: initTrack.track_id
          }
        ]
      : []
  }
  playlist.tracks = initTrack
    ? [
        {
          ...initTrack,
          user: initTrackOwner!
        }
      ]
    : []
  playlist.track_count = initTrack ? 1 : 0
  playlist.permalink = collectionPage(
    handle,
    playlist.playlist_name,
    playlistId,
    undefined,
    playlist.is_album
  )

  yield* put(
    cacheActions.add(
      Kind.COLLECTIONS,
      [{ id: playlistId, metadata: playlist }],
      /* replace= */ true, // forces cache update
      /* persistent cache */ false // Do not persistent cache since it's missing data
    )
  )

  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: user_id,
        metadata: { _collectionIds: _collectionIds.concat(playlistId) }
      }
    ])
  )

  yield* put(
    accountActions.addAccountPlaylist({
      id: playlistId,
      name: playlist.playlist_name as string,
      is_album: !!playlist.is_album,
      user: { id: user_id, handle },
      permalink: playlist?.permalink
    })
  )

  yield* call(addPlaylistsNotInLibrary)
}

function* createAndConfirmPlaylist(
  playlistId: ID,
  userId: ID,
  formFields: EditCollectionValues,
  initTrack: Nullable<Track>,
  source: string,
  isAlbum: boolean
) {
  const sdk = yield* getSDK()

  const event = make(Name.PLAYLIST_START_CREATE, {
    source,
    artworkSource: formFields.artwork
      ? formFields.artwork.source
      : formFields.cover_art_sizes
  })
  yield* put(event)

  function* confirmPlaylist() {
    const userId = yield* select(getUserId)
    if (!userId) {
      throw new Error('No userId set, cannot repost collection')
    }

    yield* call([sdk.playlists, sdk.playlists.createPlaylist], {
      userId: Id.parse(userId),
      playlistId: Id.parse(playlistId),
      trackIds: initTrack ? [Id.parse(initTrack.track_id)] : undefined,
      metadata: playlistMetadataForCreateWithSDK(formFields)
    })

    // Merge the confirmed playlist with the optimistic playlist, preferring
    // optimistic data in case other unconfirmed edits have been made.
    const { data: playlist } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getPlaylist],
      {
        userId: OptionalId.parse(userId),
        playlistId: Id.parse(playlistId)
      }
    )

    const confirmedPlaylist = playlist?.[0]
      ? userCollectionMetadataFromSDK(playlist[0])
      : null
    if (!confirmedPlaylist) {
      throw new Error(
        `Could not find confirmed playlist creation for playlist id ${playlistId}`
      )
    }

    const optimisticPlaylist = yield* select(getCollection, { id: playlistId })

    const reformattedPlaylist = {
      ...reformatCollection({
        collection: confirmedPlaylist
      }),
      ...optimisticPlaylist,
      cover_art_cids: confirmedPlaylist.cover_art_cids,
      playlist_id: confirmedPlaylist.playlist_id
    }

    yield* put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: confirmedPlaylist.playlist_id,
          metadata: reformattedPlaylist
        }
      ])
    )

    yield* call(addPlaylistsNotInLibrary)

    yield* put(
      make(Name.PLAYLIST_COMPLETE_CREATE, {
        source,
        status: 'success'
      })
    )

    yield* put(cacheCollectionsActions.createPlaylistSucceeded())

    return confirmedPlaylist
  }

  function* onError(result: RequestConfirmationError) {
    const { message, error, timeout } = result
    yield* put(
      make(Name.PLAYLIST_COMPLETE_CREATE, {
        source,
        status: 'failure'
      })
    )
    yield* put(
      cacheCollectionsActions.createPlaylistFailed(
        error,
        { userId, formFields, source },
        { message, timeout }
      )
    )
  }

  yield* put(
    requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      confirmPlaylist,
      function* () {},
      onError
    )
  )
}
