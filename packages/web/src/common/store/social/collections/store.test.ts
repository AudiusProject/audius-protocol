import {
  CollectionMetadata,
  FavoriteSource,
  Kind,
  RepostSource,
  UserMetadata
} from '@audius/common/models'
import { primeCollectionDataInternal } from '@audius/common/src/api/tan-query/utils/primeCollectionData'
import { primeUserDataInternal } from '@audius/common/src/api/tan-query/utils/primeUserData'
import {
  cacheActions,
  collectionsSocialActions as actions
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call, getContext } from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { beforeEach, describe, it } from 'vitest'

import * as sagas from 'common/store/social/collections/sagas'
import { queryClient } from 'services/query-client'
import { noopReducer } from 'store/testHelper'
import { waitForWrite } from 'utils/sagaHelpers'

const repostingUser = {
  user_id: 3,
  repost_count: 0,
  handle: 'handle',
  name: 'name'
} as UserMetadata

const defaultProviders: StaticProvider[] = [
  [call.fn(waitForWrite), undefined],
  [
    getContext('audiusSdk'),
    () => {
      return {
        collections: {}
      }
    }
  ],
  [getContext('queryClient'), queryClient]
]

beforeEach(() => {
  queryClient.clear()
})

describe('repost', () => {
  it('reposts', async () => {
    primeCollectionDataInternal({
      collections: [
        {
          playlist_id: 1,
          playlist_owner_id: 2,
          repost_count: 5
        } as CollectionMetadata
      ],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [repostingUser],
      queryClient,
      forceReplace: true
    })
    await expectSaga(sagas.watchRepostCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          collections: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          collections: {
            entries: {
              1: { metadata: { playlist_owner_id: 2, repost_count: 5 } }
            }
          },
          users: {
            entries: {
              3: { metadata: repostingUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.repostCollection(1, RepostSource.COLLECTION_PAGE))
      .call(sagas.confirmRepostCollection, 2, 1, repostingUser, {
        is_repost_of_repost: false
      })
      .put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_reposted: true,
              repost_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('does not allow owner to repost', async () => {
    await expectSaga(sagas.watchRepostCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          collections: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 2
          },
          collections: {
            entries: {
              1: { metadata: { playlist_owner_id: 2, repost_count: 5 } }
            }
          },
          users: {
            entries: {
              2: { metadata: repostingUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.undoRepostCollection(1, RepostSource.TRACK_PAGE))
      .not.call(sagas.confirmUndoRepostCollection, 2, 1, repostingUser)
      .not.put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_reposted: false,
              repost_count: 4
            }
          }
        ])
      )
      .silentRun()
  })

  it('undoes repost', async () => {
    primeCollectionDataInternal({
      collections: [
        {
          playlist_id: 1,
          playlist_owner_id: 2,
          repost_count: 5
        } as CollectionMetadata
      ],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [repostingUser],
      queryClient,
      forceReplace: true
    })
    await expectSaga(sagas.watchUndoRepostCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          collections: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          collections: {
            entries: {
              1: { metadata: { playlist_owner_id: 2, repost_count: 5 } }
            }
          },
          users: {
            entries: {
              3: { metadata: repostingUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.undoRepostCollection(1, RepostSource.TRACK_PAGE))
      .call(sagas.confirmUndoRepostCollection, 2, 1, repostingUser)
      .put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_reposted: false,
              repost_count: 4
            }
          }
        ])
      )
      .silentRun()
  })
})

describe('save', () => {
  it('saves', async () => {
    primeCollectionDataInternal({
      collections: [
        {
          playlist_id: 1,
          playlist_name: 'test',
          playlist_owner_id: 2,
          save_count: 5,
          is_album: false
        } as CollectionMetadata
      ],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [
        { user_id: 1, handle: 'saveUser' } as UserMetadata,
        { user_id: 2, handle: 'otherUser' } as UserMetadata
      ],
      queryClient,
      forceReplace: true
    })
    await expectSaga(sagas.watchSaveCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer(),
          collections: noopReducer()
        }),
        {
          account: {
            userId: 3,
            collections: {}
          },
          users: {
            entries: {
              3: { metadata: { user_id: 1, handle: 'saveUser' } },
              2: { metadata: { user_id: 2, handle: 'otherUser' } }
            }
          },
          collections: {
            entries: {
              1: {
                metadata: {
                  playlist_name: 'test',
                  playlist_owner_id: 2,
                  save_count: 5,
                  is_album: false
                }
              }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.saveCollection(1, FavoriteSource.TRACK_PAGE))
      .call(sagas.confirmSaveCollection, 2, 1, { is_save_of_repost: false })
      .put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_saved: true,
              save_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('does not allow owner to save', async () => {
    await expectSaga(sagas.watchSaveCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer(),
          collections: noopReducer()
        }),
        {
          account: {
            userId: 2,
            collections: {}
          },
          users: {
            entries: {
              2: { metadata: { user_id: 2, handle: 'owner' } }
            }
          },
          collections: {
            entries: {
              1: {
                metadata: {
                  playlist_name: 'test',
                  playlist_owner_id: 2,
                  save_count: 5,
                  is_album: false
                }
              }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.saveCollection(1, FavoriteSource.TRACK_PAGE))
      .not.call(sagas.confirmSaveCollection, 2, 1)
      .not.put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_saved: true,
              save_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('unsaves', async () => {
    primeCollectionDataInternal({
      collections: [
        {
          playlist_id: 1,
          playlist_owner_id: 2,
          save_count: 5,
          is_album: false
        } as CollectionMetadata
      ],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [
        { user_id: 1, handle: 'saveUser' } as UserMetadata,
        { user_id: 2, handle: 'otherUser' } as UserMetadata
      ],
      queryClient,
      forceReplace: true
    })

    await expectSaga(sagas.watchUnsaveCollection)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer(),
          collections: noopReducer()
        }),
        {
          account: {
            userId: 3,
            collections: {}
          },
          users: {
            entries: {
              3: { metadata: { user_id: 1, handle: 'saveUser' } },
              2: { metadata: { user_id: 2, handle: 'otherUser' } }
            }
          },
          collections: {
            entries: {
              1: {
                metadata: {
                  playlist_name: 'test',
                  playlist_owner_id: 2,
                  save_count: 5,
                  is_album: false
                }
              }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.unsaveCollection(1, FavoriteSource.TRACK_PAGE))
      .call(sagas.confirmUnsaveCollection, 2, 1)
      .put(
        cacheActions.update(Kind.COLLECTIONS, [
          {
            id: 1,
            metadata: {
              has_current_user_saved: false,
              save_count: 4
            }
          }
        ])
      )
      .silentRun()
  })
})
