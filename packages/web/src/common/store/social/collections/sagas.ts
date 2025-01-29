import { updatePlaylistLibrary } from '@audius/common/api'
import {
  Name,
  Kind,
  SmartCollectionVariant,
  ID,
  PlaylistLibrary,
  User
} from '@audius/common/models'
import {
  accountActions,
  accountSelectors,
  cacheCollectionsSelectors,
  cacheActions,
  cacheUsersSelectors,
  collectionsSocialActions as socialActions,
  getContext,
  playlistUpdatesActions,
  confirmerActions,
  getSDK,
  playlistLibraryHelpers
} from '@audius/common/store'
import {
  formatShareText,
  makeUid,
  makeKindId,
  route
} from '@audius/common/utils'
import { Id } from '@audius/sdk'
import { call, select, takeEvery, put } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { adjustUserField } from 'common/store/cache/users/sagas'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  addPlaylistsNotInLibrary,
  removePlaylistFromLibrary
} from 'common/store/playlist-library/sagaHelpers'
import { audioNftPlaylistPage } from 'utils/route'
import { waitForWrite } from 'utils/sagaHelpers'

import watchCollectionErrors from './errorSagas'
const { updatedPlaylistViewed } = playlistUpdatesActions
const { getUser } = cacheUsersSelectors
const { getCollections, getCollection } = cacheCollectionsSelectors
const { getPlaylistLibrary, getUserId, getIsGuestAccount } = accountSelectors
const { collectionPage } = route
const { removeFromPlaylistLibrary } = playlistLibraryHelpers
/* REPOST COLLECTION */

export function* watchRepostCollection() {
  yield* takeEvery(socialActions.REPOST_COLLECTION, repostCollectionAsync)
}

export function* repostCollectionAsync(
  action: ReturnType<typeof socialActions.repostCollection>
) {
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  const isGuest = yield* select(getIsGuestAccount)
  if (!userId || isGuest) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // increment the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  let collection = action.metadata
  if (!collection) {
    const collections = yield* select(getCollections, {
      ids: [action.collectionId]
    })
    collection = collections[action.collectionId]
  }

  if (collection.playlist_owner_id === userId) {
    return
  }

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: 1 })

  const event = make(Name.REPOST, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  const repostMetadata = action.isFeed
    ? // If we're on the feed, and someone i follow has
      // reposted the content i am reposting,
      // is_repost_of_repost is true
      { is_repost_of_repost: collection.followee_reposts.length !== 0 }
    : { is_repost_of_repost: false }

  yield* call(
    confirmRepostCollection,
    collection.playlist_owner_id,
    action.collectionId,
    user,
    repostMetadata
  )

  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: action.collectionId,
        metadata: {
          has_current_user_reposted: true,
          repost_count: collection.repost_count + 1
        }
      }
    ])
  )
}

export function* confirmRepostCollection(
  ownerId: ID,
  collectionId: ID,
  user: User,
  metadata: { is_repost_of_repost: boolean }
) {
  const sdk = yield* getSDK()
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const userId = yield* select(getUserId)
        if (!userId) {
          throw new Error('No userId set, cannot repost collection')
        }

        yield* call([sdk.playlists, sdk.playlists.repostPlaylist], {
          userId: Id.parse(userId),
          playlistId: Id.parse(collectionId),
          metadata: {
            isRepostOfRepost: metadata?.is_repost_of_repost ?? false
          }
        })
        return collectionId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // Revert the incremented repost count
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: -1
        })
        yield* put(
          socialActions.repostCollectionFailed(
            collectionId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchUndoRepostCollection() {
  yield* takeEvery(
    socialActions.UNDO_REPOST_COLLECTION,
    undoRepostCollectionAsync
  )
}

export function* undoRepostCollectionAsync(
  action: ReturnType<typeof socialActions.undoRepostCollection>
) {
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  const isGuest = yield* select(getIsGuestAccount)
  if (!userId || isGuest) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // decrement the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: -1 })

  const collections = yield* select(getCollections, {
    ids: [action.collectionId]
  })
  const collection = collections[action.collectionId]

  const event = make(Name.UNDO_REPOST, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  yield* call(
    confirmUndoRepostCollection,
    collection.playlist_owner_id,
    action.collectionId,
    user
  )

  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: action.collectionId,
        metadata: {
          has_current_user_reposted: false,
          repost_count: collection.repost_count - 1
        }
      }
    ])
  )
}

export function* confirmUndoRepostCollection(
  ownerId: ID,
  collectionId: ID,
  user: User
) {
  const sdk = yield* getSDK()
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const userId = yield* select(getUserId)
        if (!userId) {
          throw new Error('No userId set, cannot undo repost collection')
        }

        yield* call([sdk.playlists, sdk.playlists.unrepostPlaylist], {
          userId: Id.parse(userId),
          playlistId: Id.parse(collectionId)
        })
        return collectionId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // Revert the decrement
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: 1
        })
        yield* put(
          socialActions.repostCollectionFailed(
            collectionId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

/* SAVE COLLECTION */

export function* watchSaveCollection() {
  yield* takeEvery(
    socialActions.SAVE_COLLECTION,
    function* (action: ReturnType<typeof socialActions.saveCollection>) {
      yield* call(saveCollectionAsync, action)
    }
  )
}

export function* watchSaveSmartCollection() {
  yield* takeEvery(
    socialActions.SAVE_SMART_COLLECTION,
    function* (action: ReturnType<typeof socialActions.saveSmartCollection>) {
      yield* call(saveSmartCollection, action)
    }
  )
}

export function* saveSmartCollection(
  action: ReturnType<typeof socialActions.saveSmartCollection>
) {
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  const isGuest = yield* select(getIsGuestAccount)
  if (!userId || isGuest) {
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  const playlistLibrary = yield* select(getPlaylistLibrary)
  const newPlaylistLibrary: PlaylistLibrary = {
    ...playlistLibrary,
    contents: [
      {
        type: 'explore_playlist',
        playlist_id: action.smartCollectionName as SmartCollectionVariant
      },
      ...(playlistLibrary?.contents || [])
    ]
  }
  const sdk = yield* getSDK()
  yield* call(
    updatePlaylistLibrary,
    sdk,
    userId,
    newPlaylistLibrary,
    queryClient,
    dispatch
  )

  const event = make(Name.FAVORITE, {
    kind: 'playlist',
    source: action.source,
    id: action.smartCollectionName
  })
  yield* put(event)
}

export function* saveCollectionAsync(
  action: ReturnType<typeof socialActions.saveCollection>
) {
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  const isGuest = yield* select(getIsGuestAccount)
  if (!userId || isGuest) {
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const collections = yield* select(getCollections, {
    ids: [action.collectionId]
  })
  const collection = collections[action.collectionId]
  const user = yield* select(getUser, { id: collection.playlist_owner_id })
  if (!user) return

  if (collection.playlist_owner_id === userId) {
    return
  }

  const event = make(Name.FAVORITE, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  const saveMetadata = action.isFeed
    ? // If we're on the feed, and the content
      // being saved is a repost
      { is_save_of_repost: collection.followee_reposts.length !== 0 }
    : { is_save_of_repost: false }
  yield* call(
    confirmSaveCollection,
    collection.playlist_owner_id,
    action.collectionId,
    saveMetadata
  )

  if (!collection.is_album) {
    yield* put(updatedPlaylistViewed({ playlistId: action.collectionId }))
  }

  const subscribedUid = makeUid(
    Kind.COLLECTIONS,
    collection.playlist_id,
    'account'
  )
  yield* put(
    cacheActions.subscribe(Kind.COLLECTIONS, [
      { uid: subscribedUid, id: collection.playlist_id }
    ])
  )

  yield* put(
    accountActions.addAccountPlaylist({
      id: collection.playlist_id,
      name: collection.playlist_name,
      is_album: collection.is_album,
      user: { id: user.user_id, handle: user.handle },
      permalink: collection.permalink || ''
    })
  )

  yield* call(addPlaylistsNotInLibrary)

  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: action.collectionId,
        metadata: {
          has_current_user_saved: true,
          save_count: collection.save_count + 1
        }
      }
    ])
  )
  yield* put(socialActions.saveCollectionSucceeded(action.collectionId))
}

export function* confirmSaveCollection(
  ownerId: ID,
  collectionId: ID,
  metadata?: { is_save_of_repost: boolean }
) {
  const sdk = yield* getSDK()

  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const userId = yield* select(getUserId)
        if (!userId) {
          throw new Error('No userId set, cannot save collection')
        }

        yield* call([sdk.playlists, sdk.playlists.favoritePlaylist], {
          userId: Id.parse(userId),
          playlistId: Id.parse(collectionId),
          metadata: {
            isSaveOfRepost: metadata?.is_save_of_repost ?? false
          }
        })

        return collectionId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.saveCollectionFailed(
            collectionId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchUnsaveCollection() {
  yield* takeEvery(
    socialActions.UNSAVE_COLLECTION,
    function* (action: ReturnType<typeof socialActions.unsaveCollection>) {
      yield* call(unsaveCollectionAsync, action)
    }
  )
}

export function* watchUnsaveSmartCollection() {
  yield* takeEvery(
    socialActions.UNSAVE_SMART_COLLECTION,
    function* (action: ReturnType<typeof socialActions.unsaveSmartCollection>) {
      yield* call(unsaveSmartCollection, action)
    }
  )
}

export function* unsaveSmartCollection(
  action: ReturnType<typeof socialActions.unsaveSmartCollection>
) {
  yield* call(waitForWrite)

  const playlistLibrary = yield* select(getPlaylistLibrary)
  if (!playlistLibrary) return

  const newPlaylistLibrary = removeFromPlaylistLibrary(
    playlistLibrary,
    action.smartCollectionName as SmartCollectionVariant
  ).library

  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  yield* call(
    updatePlaylistLibrary,
    sdk,
    currentUserId,
    newPlaylistLibrary,
    queryClient,
    dispatch
  )

  const event = make(Name.UNFAVORITE, {
    kind: 'playlist',
    source: action.source,
    id: action.smartCollectionName
  })
  yield* put(event)
}

export function* unsaveCollectionAsync(
  action: ReturnType<typeof socialActions.unsaveCollection>
) {
  yield* call(waitForWrite)

  const collections = yield* select(getCollections, {
    ids: [action.collectionId]
  })
  const collection = collections[action.collectionId]

  const event = make(Name.UNFAVORITE, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  yield* call(
    confirmUnsaveCollection,
    collection.playlist_owner_id,
    action.collectionId
  )

  yield* put(
    accountActions.removeAccountPlaylist({ collectionId: action.collectionId })
  )

  yield* call(removePlaylistFromLibrary, action.collectionId)
  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: action.collectionId,
        metadata: {
          has_current_user_saved: false,
          save_count: collection.save_count - 1
        }
      }
    ])
  )
  yield* put(socialActions.unsaveCollectionSucceeded(action.collectionId))
}

export function* confirmUnsaveCollection(ownerId: ID, collectionId: ID) {
  const sdk = yield* getSDK()
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const userId = yield* select(getUserId)
        if (!userId) {
          throw new Error('No userId set, cannot save collection')
        }

        yield* call([sdk.playlists, sdk.playlists.unfavoritePlaylist], {
          userId: Id.parse(userId),
          playlistId: Id.parse(collectionId)
        })
        return collectionId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.unsaveCollectionFailed(
            collectionId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchShareCollection() {
  yield* takeEvery(
    socialActions.SHARE_COLLECTION,
    function* (action: ReturnType<typeof socialActions.shareCollection>) {
      const { collectionId } = action
      const collection = yield* select(getCollection, { id: collectionId })
      if (!collection) return

      const user = yield* select(getUser, { id: collection.playlist_owner_id })
      if (!user) return

      const link = collectionPage(
        user.handle,
        collection.playlist_name,
        collection.playlist_id,
        collection.permalink,
        collection.is_album
      )

      const share = yield* getContext('share')
      share(link, formatShareText(collection.playlist_name, user.name))

      const event = make(Name.SHARE, {
        kind: collection.is_album ? 'album' : 'playlist',
        source: action.source,
        id: collection.playlist_id,
        url: link
      })
      yield* put(event)
    }
  )
}

export function* watchShareAudioNftPlaylist() {
  yield* takeEvery(
    socialActions.SHARE_AUDIO_NFT_PLAYLIST,
    function* (action: ReturnType<typeof socialActions.shareAudioNftPlaylist>) {
      const { handle } = action
      const user = yield* select(getUser, { handle })

      const link = audioNftPlaylistPage(handle)
      const share = yield* getContext('share')
      share(link, formatShareText('Audio NFT Playlist', user?.name ?? handle))

      const event = make(Name.SHARE, {
        kind: 'audioNftPlaylist',
        source: action.source,
        url: link
      })
      yield* put(event)
    }
  )
}

const sagas = () => {
  return [
    watchRepostCollection,
    watchUndoRepostCollection,
    watchSaveCollection,
    watchSaveSmartCollection,
    watchUnsaveCollection,
    watchUnsaveSmartCollection,
    watchCollectionErrors,
    watchShareCollection,
    watchShareAudioNftPlaylist
  ]
}

export default sagas
