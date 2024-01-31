import {
  cacheActions,
  tracksSocialActions as actions
} from '@audius/common/store'
import {} from '@audius/common'
import { Kind } from '@audius/common/models'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { describe, it } from 'vitest'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import * as sagas from 'common/store/social/tracks/sagas'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { noopReducer } from 'store/testHelper'

const repostingUser = { repost_count: 0 }

describe('repost', () => {
  it('reposts', async () => {
    await expectSaga(sagas.watchRepostTrack, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              1: { metadata: { repost_count: 5 } }
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
      .dispatch(actions.repostTrack(1))
      .call(sagas.confirmRepostTrack, 1, repostingUser)
      .put(
        cacheActions.update(Kind.TRACKS, [
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
    await expectSaga(sagas.watchUndoRepostTrack, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              1: { metadata: { repost_count: 5 } }
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
      .dispatch(actions.undoRepostTrack(1))
      .call(sagas.confirmUndoRepostTrack, 1, repostingUser)
      .put(
        cacheActions.update(Kind.TRACKS, [
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
    await expectSaga(sagas.watchSaveTrack, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.saveTrack(1))
      .call(sagas.confirmSaveTrack, 1)
      .put(
        cacheActions.update(Kind.TRACKS, [
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
    await expectSaga(sagas.watchUnsaveTrack, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.unsaveTrack(1))
      .call(sagas.confirmUnsaveTrack, 1)
      .put(
        cacheActions.update(Kind.TRACKS, [
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

describe('recordListen', () => {
  it('dispatches a listen for another account', async () => {
    await expectSaga(sagas.watchRecordListen, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              1: { metadata: { owner_id: 2, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([
        [matchers.call.fn(audiusBackendInstance.recordTrackListen), true]
      ])
      .dispatch(actions.recordListen(1))
      .call(audiusBackendInstance.recordTrackListen, 1)
      .silentRun()
  })
  it('limits listens on own account', async () => {
    await expectSaga(sagas.watchRecordListen, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          tracks: {
            entries: {
              // Listens > 10 not counted
              1: { metadata: { owner_id: 1, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([
        [matchers.call.fn(audiusBackendInstance.recordTrackListen), true]
      ])
      .dispatch(actions.recordListen(1))
      .not.call.fn(audiusBackendInstance.recordTrackListen, 1)
      .silentRun()
  })
})
