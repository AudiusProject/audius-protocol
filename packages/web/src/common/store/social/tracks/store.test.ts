import {
  FavoriteSource,
  Kind,
  RepostSource,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common/models'
import { primeTrackDataInternal } from '@audius/common/src/api/tan-query/utils/primeTrackData'
import { primeUserDataInternal } from '@audius/common/src/api/tan-query/utils/primeUserData'
import {
  cacheActions,
  tracksSocialActions as actions
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { beforeEach, describe, it } from 'vitest'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import * as sagas from 'common/store/social/tracks/sagas'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { queryClient } from 'services/query-client'
import { noopReducer } from 'store/testHelper'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchRecordListen } from './recordListen'

const repostingUser = {
  user_id: 3,
  repost_count: 0,
  handle: 'handle',
  name: 'name'
} as UserMetadata
const saveUser = {
  handle: 'saveUser',
  name: 'name',
  user_id: 3
} as UserMetadata

const mockAudiusSdk = {}

const defaultProviders: StaticProvider[] = [
  [matchers.call.fn(waitForWrite), undefined],
  [matchers.call.fn(waitForBackendSetup), undefined],
  [matchers.getContext('audiusSdk'), async () => mockAudiusSdk],
  [matchers.getContext('queryClient'), queryClient]
]

beforeEach(() => {
  queryClient.clear()
})

describe('repost', () => {
  beforeEach(() => {
    primeTrackDataInternal({
      tracks: [{ track_id: 1, repost_count: 5 } as UserTrackMetadata],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [repostingUser],
      queryClient,
      forceReplace: true
    })
  })

  it('reposts', async () => {
    await expectSaga(sagas.watchRepostTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          tracks: {
            entries: {
              1: { metadata: { repost_count: 5 } }
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
      .dispatch(actions.repostTrack(1, RepostSource.TRACK_PAGE))
      .call(sagas.confirmRepostTrack, 1, repostingUser, {
        is_repost_of_repost: false
      })
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

  it('does not allow self reposts', async () => {
    primeTrackDataInternal({
      tracks: [
        { track_id: 1, repost_count: 5, owner_id: 2 } as UserTrackMetadata
      ],
      queryClient,
      forceReplace: true
    })

    await expectSaga(sagas.watchRepostTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 2
          },
          tracks: {
            entries: {
              1: { metadata: { repost_count: 5, owner_id: 2 } }
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
      .dispatch(actions.repostTrack(1, RepostSource.TRACK_PAGE))
      .not.call(sagas.confirmRepostTrack, 1, repostingUser, {
        is_repost_of_repost: false
      })
      .not.put(
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
    await expectSaga(sagas.watchUndoRepostTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          tracks: {
            entries: {
              1: { metadata: { repost_count: 5 } }
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
      .dispatch(actions.undoRepostTrack(1, RepostSource.TRACK_PAGE))
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
  beforeEach(() => {
    primeTrackDataInternal({
      tracks: [{ track_id: 1, save_count: 5 } as UserTrackMetadata],
      queryClient,
      forceReplace: true
    })
    primeUserDataInternal({
      users: [saveUser],
      queryClient,
      forceReplace: true
    })
  })

  it('saves', async () => {
    await expectSaga(sagas.watchSaveTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          tracks: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          },
          users: {
            entries: {
              4: { metadata: saveUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.saveTrack(1, FavoriteSource.TRACK_PAGE))
      .call(sagas.confirmSaveTrack, 1, saveUser, {
        is_save_of_repost: false
      })
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

  it('does not allow self saves', async () => {
    primeTrackDataInternal({
      tracks: [
        { track_id: 1, save_count: 5, owner_id: 2 } as UserTrackMetadata
      ],
      queryClient,
      forceReplace: true
    })

    await expectSaga(sagas.watchSaveTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 2
          },
          tracks: {
            entries: {
              1: { metadata: { save_count: 5, owner_id: 4 } }
            }
          },
          users: {
            entries: {
              4: { metadata: saveUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.saveTrack(1, FavoriteSource.TRACK_PAGE))
      .not.call(sagas.confirmSaveTrack, 1, saveUser, {
        is_save_of_repost: false
      })
      .not.put(
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
    await expectSaga(sagas.watchUnsaveTrack)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 3
          },
          tracks: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          },
          users: {
            entries: {
              4: { metadata: saveUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.unsaveTrack(1, FavoriteSource.TRACK_PAGE))
      .call(sagas.confirmUnsaveTrack, 1, saveUser)
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
    primeTrackDataInternal({
      tracks: [
        {
          track_id: 1,
          owner_id: 2,
          _listen_count: 11
        } as unknown as UserTrackMetadata
      ],
      queryClient,
      forceReplace: true
    })

    await expectSaga(watchRecordListen)
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
        ...defaultProviders,
        [matchers.getContext('audiusBackendInstance'), audiusBackendInstance]
      ])
      .dispatch(actions.recordListen(1))
      .call.fn(audiusBackendInstance.recordTrackListen)
      .silentRun()
  })

  it('limits listens on own account', async () => {
    primeTrackDataInternal({
      tracks: [
        { track_id: 1, owner_id: 1, listenCount: 11 } as UserTrackMetadata
      ],
      queryClient,
      forceReplace: true
    })

    await expectSaga(watchRecordListen)
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
              1: { metadata: { owner_id: 1, listenCount: 11 } }
            }
          }
        }
      )
      .provide([
        ...defaultProviders,
        [matchers.getContext('audiusBackendInstance'), audiusBackendInstance],
        [matchers.call.fn(audiusBackendInstance.recordTrackListen), true]
      ])
      .dispatch(actions.recordListen(1))
      .not.call.fn(audiusBackendInstance.recordTrackListen)
      .silentRun()
  })
})
