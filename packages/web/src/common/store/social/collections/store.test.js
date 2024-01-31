import { Kind } from '@audius/common/models'
import {
  cacheActions,
  collectionsSocialActions as actions
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { describe, it } from 'vitest'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import * as sagas from 'common/store/social/collections/sagas'
import { noopReducer } from 'store/testHelper'

const repostingUser = { repost_count: 0 }

describe('repost', () => {
  it('reposts', async () => {
    await expectSaga(sagas.watchRepostCollection, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          collections: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          collections: {
            entries: {
              1: { metadata: { playlist_owner_id: 2, repost_count: 5 } }
            }
          },
          users: {
            entries: {
              1: { metadata: repostingUser }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.repostCollection(1))
      .call(sagas.confirmRepostCollection, 2, 1, repostingUser)
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

  it('undoes repost', async () => {
    await expectSaga(sagas.watchUndoRepostCollection, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          collections: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          collections: {
            entries: {
              1: { metadata: { playlist_owner_id: 2, repost_count: 5 } }
            }
          },
          users: {
            entries: {
              1: { metadata: repostingUser }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.undoRepostCollection(1))
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
    await expectSaga(sagas.watchSaveCollection, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer(),
          collections: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          users: {
            entries: {
              1: { metadata: { user_id: 1, handle: 'saveUser' } },
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
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.saveCollection(1))
      .call(sagas.confirmSaveCollection, 2, 1)
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

  it('unsaves', async () => {
    await expectSaga(sagas.watchUnsaveCollection, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer(),
          collections: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          users: {
            entries: {
              1: { metadata: { user_id: 1, handle: 'saveUser' } },
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
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.unsaveCollection(1))
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
