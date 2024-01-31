import { playerReducer, playerActions } from '@audius/common/store'
import {} from '@audius/common'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { describe, it, expect, vitest } from 'vitest'

import { noopReducer } from 'store/testHelper'

import * as sagas from './sagas'

const initialTracks = {
  entries: {
    1: { metadata: { owner_id: 1, track_segments: {} } }
  },
  uids: {
    123: 1
  }
}

const initialUsers = {
  entries: {
    1: { metadata: { handle: 'ganondorf' } }
  }
}

const makeInitialPlayer = (playing) => ({
  audio: {
    load: vitest.fn(),
    play: vitest.fn(),
    pause: vitest.fn(),
    stop: vitest.fn(),
    seek: vitest.fn()
  },
  playing
})

describe('watchPlay', () => {
  it('plays uid', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPlay, playerActions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          users: noopReducer(initialUsers),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          users: initialUsers,
          player: initialPlayer
        }
      )
      .dispatch(playerActions.play({ uid: '123', trackId: 1, onEnd: () => {} }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.audio.load).toHaveBeenCalled()
    expect(initialPlayer.audio.play).toHaveBeenCalled()
  })

  it('plays by resuming', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchPlay, playerActions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          users: noopReducer(initialUsers),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          users: initialUsers,
          player: initialPlayer
        }
      )
      .dispatch(playerActions.play({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.audio.play).toHaveBeenCalled()
  })
})

describe('watchPause', () => {
  it('pauses', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPause, playerActions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer
        }
      )
      .dispatch(playerActions.pause({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.audio.pause).toHaveBeenCalled()
  })
})

describe('watchStop', () => {
  it('stops', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchStop, playerActions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer
        }
      )
      .dispatch(playerActions.stop({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.audio.stop).toHaveBeenCalled()
  })
})

describe('watchSeek', () => {
  it('seeks', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchSeek, playerActions)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer
        }
      )
      .dispatch(playerActions.seek({ seconds: 30 }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.audio.seek).toHaveBeenCalledWith(30)
  })
})
