import {
  Kind,
  ID,
  Name,
  PlaylistLibrary,
  SmartCollectionVariant,
  User,
  makeUid,
  makeKindId
} from '@audius/common'
import { call, select, takeEvery, put } from 'typed-redux-saga/macro'

import * as accountActions from 'common/store/account/reducer'
import { getPlaylistLibrary, getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import {
  getCollections,
  getCollection
} from 'common/store/cache/collections/selectors'
import { adjustUserField } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import * as notificationActions from 'common/store/notifications/actions'
import { removeFromPlaylistLibrary } from 'common/store/playlist-library/helpers'
import * as socialActions from 'common/store/social/collections/actions'
import { formatShareText } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/sign-on/store/actions'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { update as updatePlaylistLibrary } from 'store/playlist-library/slice'
import { albumPage, audioNftPlaylistPage, playlistPage } from 'utils/route'
import { share } from 'utils/share'

import watchCollectionErrors from './errorSagas'

/* REPOST COLLECTION */

export function* watchRepostCollection() {
  yield* takeEvery(socialActions.REPOST_COLLECTION, repostCollectionAsync)
}

export function* repostCollectionAsync(
  action: ReturnType<typeof socialActions.repostCollection>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // increment the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: 1 })

  let collection = action.metadata
  if (!collection) {
    const collections = yield* select(getCollections, {
      ids: [action.collectionId]
    })
    collection = collections[action.collectionId]
  }

  const event = make(Name.REPOST, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  yield* call(
    confirmRepostCollection,
    collection.playlist_owner_id,
    action.collectionId,
    user
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
  user: User
) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.repostCollection,
          collectionId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm repost collection for collection id ${collectionId}`
          )
        }
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
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
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
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.undoRepostCollection,
          collectionId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm undo repost collection for collection id ${collectionId}`
          )
        }
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
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }
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
  yield* put(updatePlaylistLibrary({ playlistLibrary: newPlaylistLibrary }))

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
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.showRequiresAccountModal())
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

  yield* put(accountActions.didFavoriteItem())

  const event = make(Name.FAVORITE, {
    kind: collection.is_album ? 'album' : 'playlist',
    source: action.source,
    id: action.collectionId
  })
  yield* put(event)

  yield* call(
    confirmSaveCollection,
    collection.playlist_owner_id,
    action.collectionId
  )

  if (!collection.is_album) {
    yield* put(
      notificationActions.updatePlaylistLastViewedAt(action.collectionId)
    )
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
      user: { id: user.user_id, handle: user.handle }
    })
  )
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

export function* confirmSaveCollection(ownerId: ID, collectionId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.saveCollection,
          collectionId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm save collection for collection id ${collectionId}`
          )
        }
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
  yield* call(waitForBackendSetup)

  const playlistLibrary = yield* select(getPlaylistLibrary)
  if (!playlistLibrary) return

  const newPlaylistLibrary = removeFromPlaylistLibrary(
    playlistLibrary,
    action.smartCollectionName as SmartCollectionVariant
  ).library
  yield* put(updatePlaylistLibrary({ playlistLibrary: newPlaylistLibrary }))
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
  yield* call(waitForBackendSetup)
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
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, collectionId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.unsaveCollection,
          collectionId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm unsave collection for collection id ${collectionId}`
          )
        }
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

      const link = collection.is_album
        ? albumPage(
            user.handle,
            collection.playlist_name,
            collection.playlist_id
          )
        : playlistPage(
            user.handle,
            collection.playlist_name,
            collection.playlist_id
          )
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
