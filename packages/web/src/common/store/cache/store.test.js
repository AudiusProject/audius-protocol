import {
  cacheActions as actions,
  cacheConfig as config,
  cacheReducer
} from '@audius/common/store'

import { Kind, Status } from '@audius/common/models'
import { makeKindId } from '@audius/common/utils'
/* eslint-disable no-import-assign */
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { describe, it, expect, vitest } from 'vitest'

import sagas from 'common/store/cache/sagas'
import {
  allSagas,
  noopReducer,
  takeEverySaga,
  takeSaga
} from 'store/testHelper'
const { asCache, initialCacheState } = cacheReducer

const initialConfirmerState = {
  confirm: {},
  complete: {},
  operationSuccessCallIdx: {}
}

const MOCK_TIMESTAMP = 1479427200000

beforeAll(() => {
  config.CACHE_PRUNE_MIN = 1
  vitest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
})

describe('add', () => {
  it('can add one', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: noopReducer()
        }),
        {
          tracks: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          }
        ])
      )
      .put(
        actions.addSucceeded({
          kind: Kind.TRACKS,
          entries: [
            {
              id: 1,
              uid: '111',
              metadata: { data: 10 }
            }
          ]
        })
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      1: { metadata: { data: 10 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('does not add if confirming', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: noopReducer()
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            }
          },
          confirmer: {
            ...initialConfirmerState,
            confirm: {
              [makeKindId(Kind.TRACKS, 1)]: () => {}
            }
          }
        }
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          }
        ])
      )
      .put(
        actions.subscribe(Kind.TRACKS, [
          {
            id: 1,
            uid: '111'
          }
        ])
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      ...initialCacheState.entries,
      1: { metadata: { data: 10 } }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('can add multiple', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: noopReducer()
        }),
        {
          tracks: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          },
          {
            id: 2,
            uid: '222',
            metadata: { data: 20 }
          }
        ])
      )
      .put(
        actions.addSucceeded({
          kind: Kind.TRACKS,
          entries: [
            {
              id: 1,
              uid: '111',
              metadata: { data: 10 }
            },
            {
              id: 2,
              uid: '222',
              metadata: { data: 20 }
            }
          ]
        })
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 3,
            uid: '333',
            metadata: { data: 30 }
          }
        ])
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      1: { metadata: { data: 10 }, _timestamp: MOCK_TIMESTAMP },
      2: { metadata: { data: 20 }, _timestamp: MOCK_TIMESTAMP },
      3: { metadata: { data: 30 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      222: 2,
      333: 3
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111']),
      2: new Set(['222']),
      3: new Set(['333'])
    })
  })

  it('does not replace when unless explicitly told', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: noopReducer()
        }),
        {
          tracks: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '111',
            metadata: { oldValue: 10 }
          }
        ])
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '222',
            metadata: { newValue: 20 }
          }
        ])
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      1: {
        metadata: { oldValue: 10, newValue: 20 },
        _timestamp: MOCK_TIMESTAMP
      }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      222: 1
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111', '222'])
    })
  })

  it('does replace when explicitly told', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: noopReducer()
        }),
        {
          tracks: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.TRACKS, [
          {
            id: 1,
            uid: '111',
            metadata: { oldValue: 10 }
          }
        ])
      )
      .dispatch(
        actions.add(
          Kind.TRACKS,
          [
            {
              id: 1,
              uid: '222',
              metadata: { newValue: 20 }
            }
          ],
          true
        )
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      1: { metadata: { newValue: 20 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      222: 1
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111', '222'])
    })
  })
})

describe('update', () => {
  it('can update', async () => {
    const { storeState } = await expectSaga(
      takeEverySaga(actions.UPDATE),
      actions
    )
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              112: 1,
              222: 2
            },
            subscribers: {
              1: new Set(['111', '112']),
              2: new Set(['222'])
            }
          }
        }
      )
      .dispatch(
        actions.update(Kind.TRACKS, [
          {
            id: 1,
            metadata: { data: 11 }
          }
        ])
      )
      .dispatch(
        actions.update(Kind.TRACKS, [
          {
            id: 2,
            metadata: { data: 21 }
          }
        ])
      )
      .silentRun()
    expect(storeState.tracks.entries).toEqual({
      1: { metadata: { data: 11 }, _timestamp: MOCK_TIMESTAMP },
      2: { metadata: { data: 21 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      112: 1,
      222: 2
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111', '112']),
      2: new Set(['222'])
    })
  })

  it('can transitively subscribe', async () => {
    const { storeState } = await expectSaga(takeSaga(actions.UPDATE), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          collections: asCache(noopReducer(), Kind.COLLECTIONS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              112: 1,
              222: 2
            },
            subscribers: {
              1: new Set(['111', '112']),
              2: new Set(['222'])
            }
          },
          collections: {
            ...initialCacheState,
            entries: {
              1: { tracks: [1, 2] }
            }
          }
        }
      )
      // id 2 subscribes to id 1
      .dispatch(
        actions.update(
          Kind.COLLECTIONS,
          [],
          [
            {
              id: 1,
              kind: Kind.TRACKS,
              uids: ['111', '222']
            }
          ]
        )
      )
      .silentRun()
    expect(storeState.collections.subscriptions).toEqual({
      1: new Set([
        { kind: Kind.TRACKS, uid: '111' },
        { kind: Kind.TRACKS, uid: '222' }
      ])
    })
  })
})

describe('setStatus', () => {
  it('sets status', async () => {
    const { storeState } = await expectSaga(
      takeSaga(actions.SET_STATUS),
      actions
    )
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            statuses: {
              1: Status.LOADING
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(
        actions.setStatus(Kind.TRACKS, [
          {
            id: 1,
            status: Status.SUCCESS
          }
        ])
      )
      .silentRun()
    expect(storeState.tracks.statuses).toEqual({
      1: Status.SUCCESS
    })
  })
})

describe('remove', () => {
  it('can remove one', async () => {
    const initialTestState = {
      ...initialCacheState,
      entries: {
        1: { metadata: { data: 10 } }
      },
      statuses: {
        1: Status.SUCCESS
      },
      uids: {
        111: 1,
        222: 1
      },
      subscribers: {
        1: new Set(['111', '222'])
      }
    }

    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: initialTestState
        }
      )
      .dispatch(actions.remove(Kind.TRACKS, [1]))
      .silentRun()
    expect(storeState.tracks).toEqual({
      ...initialCacheState
    })
  })
})

describe('remove with pruning', () => {
  beforeAll(() => {
    config.CACHE_PRUNE_MIN = 2
  })
  afterAll(() => {
    config.CACHE_PRUNE_MIN = 1
  })

  it('can mark to be pruned', async () => {
    const initialTestState = {
      ...initialCacheState,
      entries: {
        1: { metadata: { data: 10 } }
      },
      statuses: {
        1: Status.SUCCESS
      },
      uids: {
        111: 1,
        222: 1
      },
      subscribers: {
        1: new Set(['111', '222'])
      }
    }

    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: initialTestState
        }
      )
      .dispatch(actions.remove(Kind.TRACKS, [1]))
      .silentRun()
    expect(storeState.tracks).toEqual({
      ...initialTestState,
      idsToPrune: new Set([1])
    })
  })
})

describe('subscribe', () => {
  it('can add a subscription', async () => {
    const { storeState } = await expectSaga(
      takeEverySaga(actions.SUBSCRIBE),
      actions
    )
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.subscribe(Kind.TRACKS, [{ uid: '333', id: 1 }]))
      .dispatch(actions.subscribe(Kind.TRACKS, [{ uid: '444', id: 2 }]))
      .silentRun()
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      222: 1,
      333: 1,
      444: 2
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111', '222', '333']),
      2: new Set(['444'])
    })
  })
})

describe('unsubscribe', () => {
  it('can remove a subscription', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.TRACKS, [{ uid: '222', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.TRACKS, [{ uid: '222', id: 1 }]))
      .silentRun()
    expect(storeState.tracks.uids).toEqual({
      111: 1
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('transitively unsubscribes', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          collections: asCache(noopReducer(), Kind.COLLECTIONS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              222: 1,
              333: 2
            },
            subscribers: {
              1: new Set(['111', '222']),
              2: new Set(['333'])
            }
          },
          collections: {
            ...initialCacheState,
            entries: {
              1: { tracks: [1, 2] }
            },
            uids: {
              444: 1
            },
            subscribers: {
              1: new Set(['444'])
            },
            subscriptions: {
              1: new Set([{ kind: Kind.TRACKS, uid: '222' }])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.COLLECTIONS, [{ uid: '444', id: 1 }]))
      .put(actions.unsubscribe(Kind.TRACKS, [{ uid: '222' }]))
      .put(
        actions.unsubscribeSucceeded(Kind.COLLECTIONS, [{ uid: '444', id: 1 }])
      )
      .put(actions.unsubscribeSucceeded(Kind.TRACKS, [{ uid: '222' }]))
      .silentRun()
    expect(storeState.tracks.uids).toEqual({
      111: 1,
      333: 2
    })
    expect(storeState.tracks.subscribers).toEqual({
      1: new Set(['111']),
      2: new Set(['333'])
    })
    expect(storeState.collections).toEqual(initialCacheState)
  })

  it('removes entries with no subscribers', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS)
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.TRACKS, [{ uid: '111', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.TRACKS, [{ uid: '111', id: 1 }]))
      .dispatch(actions.unsubscribe(Kind.TRACKS, [{ uid: '222', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.TRACKS, [{ uid: '222', id: 1 }]))
      .put(actions.remove(Kind.TRACKS, [1]))
      .silentRun()
    expect(storeState.tracks).toEqual(initialCacheState)
  })
})
