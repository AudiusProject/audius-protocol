import {
  albumMetadataForSDK,
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
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

const { requestConfirmation } = confirmerActions
const { getUserId, getAccountUser } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { getUser } = cacheUsersSelectors
const { collectionPage } = route

export function* createAlbumSaga() {
  yield* takeLatest(cacheCollectionsActions.CREATE_PLAYLIST, createAlbumWorker)
}

function* createAlbumWorker(
  action: ReturnType<typeof cacheCollectionsActions.createAlbum>
) {
  // Return early if this is not an album
  if (!action.isAlbum) return

  yield* waitForWrite()
  const userId = yield* call(ensureLoggedIn)
  const { initTrackId, formFields, source, noticeType } = action
  const collection = newCollectionMetadata({ ...formFields, is_album: true })
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

  yield* call(optimisticallySaveAlbum, collectionId, collection, initTrack)
  yield* put(
    cacheCollectionsActions.createPlaylistRequested(
      collectionId,
      noticeType,
      true
    )
  )
  yield* call(
    createAndConfirmAlbum,
    collectionId,
    userId,
    collection,
    initTrack,
    source
  )
}

function* optimisticallySaveAlbum(
  albumId: ID,
  formFields: Partial<CollectionMetadata>,
  initTrack: Nullable<Track>
) {
  const accountUser = yield* select(getAccountUser)
  if (!accountUser) return
  const { user_id, handle, _collectionIds = [] } = accountUser
  const album: Partial<Collection> = {
    playlist_id: albumId,
    ...formFields
  }

  const initTrackOwner = yield* select(getUser, { id: initTrack?.owner_id })

  album.playlist_owner_id = user_id
  album.is_private = true
  album.playlist_contents = {
    track_ids: initTrack
      ? [
          {
            time: Math.round(Date.now() / 1000),
            track: initTrack.track_id
          }
        ]
      : []
  }
  album.tracks = initTrack
    ? [
        {
          ...initTrack,
          user: initTrackOwner!
        }
      ]
    : []
  album.track_count = initTrack ? 1 : 0
  album.permalink = collectionPage(
    handle,
    album.playlist_name,
    albumId,
    undefined,
    true
  )

  yield* put(
    cacheActions.add(
      Kind.COLLECTIONS,
      [{ id: albumId, metadata: album }],
      true,
      false
    )
  )

  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: user_id,
        metadata: { _collectionIds: _collectionIds.concat(albumId) }
      }
    ])
  )
}

function* createAndConfirmAlbum(
  albumId: ID,
  userId: ID,
  formFields: EditCollectionValues,
  initTrack: Nullable<Track>,
  source: string
) {
  const sdk = yield* getSDK()

  const event = make(Name.PLAYLIST_START_CREATE, {
    source,
    artworkSource: formFields.artwork
      ? formFields.artwork.source
      : formFields.cover_art_sizes
  })
  yield* put(event)

  function* confirmAlbum() {
    const userId = yield* select(getUserId)
    if (!userId) {
      throw new Error('No userId set, cannot create album')
    }

    yield* call([sdk.albums, sdk.albums.createAlbum], {
      userId: Id.parse(userId),
      albumId: Id.parse(albumId),
      trackIds: initTrack ? [Id.parse(initTrack.track_id)] : undefined,
      metadata: albumMetadataForSDK(formFields)
    })

    const { data: album } = yield* call(
      [sdk.full.playlists, sdk.full.playlists.getPlaylist],
      {
        userId: OptionalId.parse(userId),
        playlistId: Id.parse(albumId)
      }
    )

    const confirmedAlbum = album?.[0]
      ? userCollectionMetadataFromSDK(album[0])
      : null
    if (!confirmedAlbum) {
      throw new Error(
        `Could not find confirmed album creation for album id ${albumId}`
      )
    }

    const optimisticAlbum = yield* select(getCollection, { id: albumId })

    const reformattedAlbum = {
      ...reformatCollection({
        collection: confirmedAlbum
      }),
      ...optimisticAlbum,
      cover_art_cids: confirmedAlbum.cover_art_cids,
      playlist_id: confirmedAlbum.playlist_id
    }

    yield* put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: confirmedAlbum.playlist_id,
          metadata: reformattedAlbum
        }
      ])
    )

    yield* put(
      make(Name.PLAYLIST_COMPLETE_CREATE, {
        source,
        status: 'success'
      })
    )

    yield* put(cacheCollectionsActions.createPlaylistSucceeded())

    return confirmedAlbum
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
      makeKindId(Kind.COLLECTIONS, albumId),
      confirmAlbum,
      function* () {},
      onError
    )
  )
}
