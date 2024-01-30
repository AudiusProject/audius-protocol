import {
  accountReducer,
  cacheActions,
  queueReducer as reducer,
  queueActions as actions,
  RepeatMode,
  QueueSource,
  playerReducer,
  playerActions
} from '@audius/common'
import { Kind } from '@audius/common/models'
import { combineReducers } from 'redux'
import { take } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { describe, it, expect } from 'vitest'

import * as sagas from 'common/store/queue/sagas'
import { getRecommendedTracks } from 'common/store/recommendation/sagas'
import { noopReducer } from 'store/testHelper'

const initialTracks = {
  entries: {
    1: { metadata: { track_segments: {} } },
    2: { metadata: { track_segments: {} } },
    3: { metadata: { track_segments: {} } },
    4: { metadata: { track_segments: {} } },
    5: { metadata: { track_segments: {} } }
  },
  uids: {
    'kind:TRACKS-id:1-count:1': 1,
    'kind:TRACKS-id:2-count:2': 2,
    'kind:TRACKS-id:3-count:3': 3,
    'kind:TRACKS-id:4-count:4': 4,
    'kind:TRACKS-id:5-count:5': 5
  }
}

const makeInitialQueue = (config) => ({
  order: [
    { id: 1, uid: 'kind:TRACKS-id:1-count:1' },
    { id: 2, uid: 'kind:TRACKS-id:2-count:2' },
    { id: 3, uid: 'kind:TRACKS-id:3-count:3' }
  ],
  positions: {
    'kind:TRACKS-id:1-count:1': 0,
    'kind:TRACKS-id:2-count:2': 1,
    'kind:TRACKS-id:3-count:3': 2
  },
  index: -1,
  repeat: RepeatMode.OFF,
  shuffle: false,
  shuffleIndex: -1,
  shuffleOrder: [2, 0, 1],
  queueAutoplay: true,
  ...config
})

const makeInitialPlayer = (config = {}) => ({
  // Identifier for the audio that's playing.
  uid: null,
  trackId: null,
  // Keep 'playing' in the store separately from the audio
  // object to allow components to subscribe to changes.
  playing: false,
  counter: 0,
  ...config
})

const makeInitialAccount = (config = {}) => ({
  userId: null,
  ...config
})

describe('watchPlay', () => {
  it('plays uid', async () => {
    const initialQueue = makeInitialQueue()
    const { storeState } = await expectSaga(sagas.watchPlay, actions)
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer,
          tracks: noopReducer(initialTracks)
        }),
        {
          queue: initialQueue,
          tracks: initialTracks
        }
      )
      .dispatch(actions.play({ uid: 'kind:TRACKS-id:1-count:1' }))
      .put(playerActions.stop({}))
      .put(actions.persist({}))
      .put(
        playerActions.play({
          uid: 'kind:TRACKS-id:1-count:1',
          trackId: undefined,
          onEnd: actions.next
        })
      )
      .silentRun()
    expect(storeState.queue.index).toEqual(0)
  })

  it('plays without uid', async () => {
    const initialQueue = makeInitialQueue({ index: 0 })
    const { storeState } = await expectSaga(sagas.watchPlay, actions)
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer,
          tracks: noopReducer(initialTracks)
        }),
        {
          queue: initialQueue,
          tracks: initialTracks
        }
      )
      .dispatch(actions.play({}))
      .put(actions.persist({}))
      .put(playerActions.play({}))
      .silentRun()
    expect(storeState.queue.index).toEqual(0)
  })
})

describe('watchPause', () => {
  it('pauses', async () => {
    const initialQueue = makeInitialQueue({ index: 0 })
    const { storeState } = await expectSaga(sagas.watchPause, actions)
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer,
          tracks: noopReducer(initialTracks)
        }),
        {
          queue: initialQueue,
          tracks: initialTracks
        }
      )
      .dispatch(actions.pause({}))
      .put(playerActions.pause({}))
      .silentRun()
    expect(storeState.queue.index).toEqual(0)
  })
})

describe('watchNext', () => {
  it('queues autoplay', async () => {
    const initialQueue = makeInitialQueue({ index: 1 })
    const playingEntry = initialQueue.order[initialQueue.index]
    const nextPlayingEntry = initialQueue.order[initialQueue.index + 1]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const initialAccount = makeInitialAccount({ userId: 1 })
    const { storeState } = await expectSaga(sagas.watchNext, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer,
          account: accountReducer
        }),
        {
          player: initialPlayer,
          tracks: initialTracks,
          queue: initialQueue,
          account: initialAccount
        }
      )
      .dispatch(actions.next({}))
      .put(
        actions.queueAutoplay({
          genre: initialTracks.entries[1].genre,
          exclusionList: [initialTracks.entries[1].track_id],
          currentUserId: 1
        })
      )
      .put(
        actions.play({
          uid: nextPlayingEntry.uid,
          trackId: nextPlayingEntry.id,
          source: undefined
        })
      )
      .silentRun()
    expect(storeState.queue.index).toEqual(2)
  })

  it('does not queue autoplay when in shuffle mode', async () => {
    const initialQueue = makeInitialQueue({
      index: 0,
      shuffle: true,
      shuffleIndex: 0
    })
    const playingEntry =
      initialQueue.order[initialQueue.shuffleOrder[initialQueue.shuffleIndex]]
    const nextPlayingEntry =
      initialQueue.order[
        initialQueue.shuffleOrder[initialQueue.shuffleIndex + 1]
      ]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState, effects } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry
    )
    expect(storeState.queue.index).toEqual(
      initialQueue.shuffleOrder[initialQueue.shuffleIndex + 1]
    )
    effects.put
      .map((x) => x.payload.action)
      .forEach((action) => expect(action.type).not.toEqual('queue/add'))
  })

  it('does not queue autoplay when in repeat mode', async () => {
    let initialQueue, playingEntry, nextPlayingEntry, initialPlayer
    initialQueue = makeInitialQueue({ index: 0, repeat: RepeatMode.ALL })
    playingEntry = initialQueue.order[initialQueue.index]
    nextPlayingEntry = initialQueue.order[initialQueue.index + 1]
    initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState: repeatAllStoreState, effects: repeatAllEffects } =
      await expectNextSagaAndGetStoreState(
        initialPlayer,
        initialQueue,
        nextPlayingEntry
      )
    expect(repeatAllStoreState.queue.index).toEqual(initialQueue.index + 1)
    repeatAllEffects.put
      .map((x) => x.payload.action)
      .forEach((action) => expect(action.type).not.toEqual('queue/add'))

    initialQueue = makeInitialQueue({ index: 0, repeat: RepeatMode.SINGLE })
    playingEntry = initialQueue.order[initialQueue.index]
    nextPlayingEntry = initialQueue.order[initialQueue.index]
    initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const {
      storeState: repeatSingleAndSkipStoreState,
      effects: repeatSingleAndSkipEffects
    } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry,
      { skip: false }
    )
    expect(repeatSingleAndSkipStoreState.queue.index).toEqual(
      initialQueue.index
    )
    repeatSingleAndSkipEffects.put
      .map((x) => x.payload.action)
      .forEach((action) => expect(action.type).not.toEqual('queue/add'))
  })

  it('plays the next track', async () => {
    const initialQueue = makeInitialQueue({ index: 0 })
    const playingEntry = initialQueue.order[initialQueue.index]
    const nextPlayingEntry = initialQueue.order[initialQueue.index + 1]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry
    )
    expect(storeState.queue.index).toEqual(1)
  })

  it('plays the next shuffle track', async () => {
    const initialQueue = makeInitialQueue({
      index: 0,
      shuffle: true,
      shuffleIndex: 1
    })
    const playingEntry = initialQueue.order[initialQueue.index]
    const nextPlayingEntry =
      initialQueue.order[
        initialQueue.shuffleOrder[initialQueue.shuffleIndex + 1]
      ]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry
    )
    expect(storeState.queue.index).toEqual(1)
  })

  it('repeats the same track if not skipped', async () => {
    const initialQueue = makeInitialQueue({
      index: 0,
      repeat: RepeatMode.SINGLE
    })
    const playingEntry = initialQueue.order[initialQueue.index]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      playingEntry
    )
    expect(storeState.queue.index).toEqual(0)
  })

  // Note: This test is untested, as the unit testing process was broken when it was written
  // If it breaks on first run, it may be bugged
  it('repeats the same track when in shuffle mode', async () => {
    const initialQueue = makeInitialQueue({
      index: 0,
      repeat: RepeatMode.SINGLE,
      shuffle: true,
      shuffleIndex: 0
    })
    const playingEntry =
      initialQueue.order[initialQueue.shuffleOrder[initialQueue.shuffleIndex]]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      playingEntry
    )
    expect(storeState.queue.index).toEqual(0)
  })

  it('does not repeat the same track if skipped', async () => {
    const initialQueue = makeInitialQueue({
      index: 0,
      repeat: RepeatMode.SINGLE
    })
    const playingEntry = initialQueue.order[initialQueue.index]
    const nextPlayingEntry = initialQueue.order[initialQueue.index + 1]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry,
      { skip: true }
    )
    expect(storeState.queue.index).toEqual(1)
  })

  it('repeats the queue', async () => {
    const initialQueue = makeInitialQueue({ index: 2, repeat: RepeatMode.ALL })
    const playingEntry = initialQueue.order[initialQueue.index]
    const nextPlayingEntry =
      initialQueue.order[(initialQueue.index + 1) % initialQueue.order.length]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectNextSagaAndGetStoreState(
      initialPlayer,
      initialQueue,
      nextPlayingEntry
    )
    expect(storeState.queue.index).toEqual(0)
  })

  async function expectNextSagaAndGetStoreState(
    initialPlayer,
    initialQueue,
    nextPlayingEntry,
    nextPayload = {}
  ) {
    const initialAccount = makeInitialAccount({ userId: 1 })
    return await expectSaga(sagas.watchNext, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer,
          account: accountReducer
        }),
        {
          player: initialPlayer,
          tracks: initialTracks,
          queue: initialQueue,
          account: initialAccount
        }
      )
      .dispatch(actions.next(nextPayload))
      .put(
        actions.play({
          uid: nextPlayingEntry.uid,
          trackId: nextPlayingEntry.id,
          source: undefined
        })
      )
      .silentRun()
  }
})

describe('watchQueueAutoplay', () => {
  it('adds tracks to queue', async () => {
    const recommendedTracks = [
      {
        track_id: 1
      }
    ]
    const expectedRecommendedTracks = [
      {
        id: 1,
        uid: 'kind:TRACKS-id:1-count:1',
        source: QueueSource.RECOMMENDED_TRACKS
      }
    ]
    await expectSaga(sagas.watchQueueAutoplay, actions)
      .provide([[matchers.call.fn(getRecommendedTracks), recommendedTracks]])
      .dispatch(actions.queueAutoplay({}))
      .put(actions.add({ entries: expectedRecommendedTracks }))
      .silentRun()
  })
})

describe('watchPrevious', () => {
  it('plays the previous track', async () => {
    const initialQueue = makeInitialQueue({ index: 2 })
    const playingEntry = initialQueue.order[initialQueue.index]
    const prevPlayingEntry =
      initialQueue.order[(initialQueue.index - 1) % initialQueue.order.length]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectSaga(sagas.watchPrevious, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          player: initialPlayer,
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(actions.previous({}))
      .put(
        actions.play({
          uid: prevPlayingEntry.uid,
          trackId: prevPlayingEntry.id,
          source: undefined
        })
      )
      .silentRun()
    expect(storeState.queue.index).toEqual(1)
  })

  it('plays the previous shuffle track', async () => {
    const initialQueue = makeInitialQueue({
      index: 1,
      shuffle: true,
      shuffleIndex: 2
    })
    const playingEntry = initialQueue.order[initialQueue.index]
    const previousPlayingEntry =
      initialQueue.order[
        initialQueue.shuffleOrder[initialQueue.shuffleIndex - 1]
      ]
    const initialPlayer = makeInitialPlayer({
      uid: playingEntry.uid,
      trackId: playingEntry.id,
      playing: true
    })
    const { storeState } = await expectSaga(sagas.watchPrevious, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          player: initialPlayer,
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(actions.previous({}))
      .put(
        actions.play({
          uid: previousPlayingEntry.uid,
          trackId: previousPlayingEntry.id,
          source: undefined
        })
      )
      .silentRun()
    expect(storeState.queue.index).toEqual(0)
  })
})

describe('watchRepeat', () => {
  it('sets repeat mode', async () => {
    const initialQueue = makeInitialQueue({ repeat: RepeatMode.OFF })
    const { storeState } = await expectSaga(function* () {
      yield take(actions.repeat.type)
    })
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer
        }),
        {
          queue: initialQueue
        }
      )
      .dispatch(actions.repeat({ mode: RepeatMode.ALL }))
      .silentRun()
    expect(storeState.queue.repeat).toEqual(RepeatMode.ALL)
  })
})

describe('watchShuffle', () => {
  it('sets shuffle', async () => {
    const initialQueue = makeInitialQueue({ shuffle: false })
    const { storeState } = await expectSaga(function* () {
      yield take(actions.shuffle.type)
    })
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer
        }),
        {
          queue: initialQueue
        }
      )
      .dispatch(actions.shuffle({ enable: true }))
      .silentRun()
    expect(storeState.queue.shuffle).toEqual(true)
  })
})

describe('watchAdd', () => {
  it('adds tracks', async () => {
    const initialQueue = makeInitialQueue()
    const { storeState } = await expectSaga(sagas.watchAdd, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(
        actions.add({
          entries: [
            { id: 4, uid: 'kind:TRACKS-id:4-count:4' },
            { id: 5, uid: 'kind:TRACKS-id:5-count:5' }
          ]
        })
      )
      .put(
        cacheActions.subscribe(Kind.TRACKS, [
          { uid: 'QUEUE', id: 4 },
          { uid: 'QUEUE', id: 5 }
        ])
      )
      .put(actions.persist({}))
      .silentRun()
    expect(storeState.queue).toMatchObject({
      order: [
        { id: 1, uid: 'kind:TRACKS-id:1-count:1' },
        { id: 2, uid: 'kind:TRACKS-id:2-count:2' },
        { id: 3, uid: 'kind:TRACKS-id:3-count:3' },
        { id: 4, uid: 'kind:TRACKS-id:4-count:4' },
        { id: 5, uid: 'kind:TRACKS-id:5-count:5' }
      ],
      positions: {
        'kind:TRACKS-id:1-count:1': 0,
        'kind:TRACKS-id:2-count:2': 1,
        'kind:TRACKS-id:3-count:3': 2,
        'kind:TRACKS-id:4-count:4': 3,
        'kind:TRACKS-id:5-count:5': 4
      }
    })
    expect(storeState.queue.shuffleOrder).toHaveLength(5)
  })

  it('adds tracks at position', async () => {
    const initialQueue = makeInitialQueue()
    const { storeState } = await expectSaga(sagas.watchAdd, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(
        actions.add({
          entries: [
            { id: 4, uid: 'kind:TRACKS-id:4-count:4' },
            { id: 5, uid: 'kind:TRACKS-id:5-count:5' }
          ],
          index: 1
        })
      )
      .put(
        cacheActions.subscribe(Kind.TRACKS, [
          { uid: 'QUEUE', id: 4 },
          { uid: 'QUEUE', id: 5 }
        ])
      )
      .put(actions.persist({}))
      .silentRun()
    expect(storeState.queue).toMatchObject({
      order: [
        { id: 1, uid: 'kind:TRACKS-id:1-count:1' },
        { id: 4, uid: 'kind:TRACKS-id:4-count:4' },
        { id: 5, uid: 'kind:TRACKS-id:5-count:5' },
        { id: 2, uid: 'kind:TRACKS-id:2-count:2' },
        { id: 3, uid: 'kind:TRACKS-id:3-count:3' }
      ],
      positions: {
        'kind:TRACKS-id:1-count:1': 0,
        'kind:TRACKS-id:2-count:2': 3,
        'kind:TRACKS-id:3-count:3': 4,
        'kind:TRACKS-id:4-count:4': 1,
        'kind:TRACKS-id:5-count:5': 2
      }
    })
    expect(storeState.queue.shuffleOrder).toHaveLength(5)
  })
})

describe('watchRemove', () => {
  it('removes a track', async () => {
    const initialQueue = makeInitialQueue()
    const { storeState } = await expectSaga(sagas.watchRemove, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(actions.remove({ uid: 'kind:TRACKS-id:2-count:2' }))
      .put(cacheActions.unsubscribe(Kind.TRACKS, [{ uid: 'QUEUE', id: 2 }]))
      .silentRun()
    expect(storeState.queue).toMatchObject({
      order: [
        { id: 1, uid: 'kind:TRACKS-id:1-count:1' },
        { id: 3, uid: 'kind:TRACKS-id:3-count:3' }
      ],
      positions: {
        'kind:TRACKS-id:1-count:1': 0,
        'kind:TRACKS-id:3-count:3': 1
      }
    })
    expect(storeState.queue.shuffleOrder).toHaveLength(2)
  })
})

describe('watchClear', () => {
  it('clears the queue', async () => {
    const initialQueue = makeInitialQueue({ shuffle: false })
    const { storeState } = await expectSaga(function* () {
      yield take(actions.clear.type)
    })
      .withReducer(
        combineReducers({
          queue: reducer,
          player: playerReducer
        }),
        {
          queue: initialQueue
        }
      )
      .dispatch(actions.clear({}))
      .silentRun()
    expect(storeState.queue).toMatchObject({
      order: [],
      positions: {},
      index: -1,
      shuffleOrder: [],
      shuffleIndex: -1
    })
  })
})

describe('watchReorder', () => {
  it('reorders the queue', async () => {
    const initialQueue = makeInitialQueue()
    const { storeState } = await expectSaga(function* () {
      yield take(actions.reorder.type)
    }, actions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          queue: reducer,
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          queue: initialQueue
        }
      )
      .dispatch(
        actions.reorder({
          orderedUids: [
            'kind:TRACKS-id:3-count:3',
            'kind:TRACKS-id:1-count:1',
            'kind:TRACKS-id:2-count:2'
          ]
        })
      )
      .silentRun()
    expect(storeState.queue).toMatchObject({
      order: [
        { id: 3, uid: 'kind:TRACKS-id:3-count:3' },
        { id: 1, uid: 'kind:TRACKS-id:1-count:1' },
        { id: 2, uid: 'kind:TRACKS-id:2-count:2' }
      ],
      positions: {
        'kind:TRACKS-id:1-count:1': 1,
        'kind:TRACKS-id:2-count:2': 2,
        'kind:TRACKS-id:3-count:3': 0
      }
    })
  })
})
