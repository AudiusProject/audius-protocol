import {
  playerReducer,
  playerActions,
  reachabilitySelectors,
  gatedContentSelectors
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call, getContext, select } from 'redux-saga-test-plan/matchers'
import * as matchers from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { describe, it, expect, vitest } from 'vitest'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { noopReducer } from 'store/testHelper'
import { waitForWrite } from 'utils/sagaHelpers'

import * as sagas from './sagas'

type PlayerState = ReturnType<typeof playerReducer>

const initialTracks = {
  entries: {
    1: { metadata: { owner_id: 1, track_segments: [] } }
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

const makeInitialPlayer = (playing: boolean) => ({
  load: vitest.fn(),
  play: vitest.fn(),
  pause: vitest.fn(),
  stop: vitest.fn(),
  seek: vitest.fn(),
  getPlaybackRate: vitest.fn(),
  setPlaybackRate: vitest.fn(),
  playing
})

const mockAudiusSdk = {
  services: {
    audiusWalletClient: {
      sign: () => [[], []]
    }
  },
  tracks: {
    getTrackStreamUrl: () => 'https://example.com/stream'
  }
}
const defaultProviders: StaticProvider[] = [
  [call.fn(waitForWrite), undefined],
  [select(reachabilitySelectors.getIsReachable), true],
  [select(gatedContentSelectors.getNftAccessSignatureMap), {}],
  [getContext('getFeatureEnabled'), () => false],
  [matchers.getContext('audiusSdk'), async () => mockAudiusSdk],
  [matchers.getContext('audiusBackendInstance'), audiusBackendInstance]
]

describe('watchPlay', () => {
  it('plays uid', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPlay)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          tracks: noopReducer(initialTracks),
          users: noopReducer(initialUsers),
          player: playerReducer
        }),
        {
          account: {
            userId: 1
          },
          tracks: initialTracks,
          users: initialUsers,
          player: initialPlayer as unknown as PlayerState
        }
      )
      .provide([
        ...defaultProviders,
        [getContext('audioPlayer'), initialPlayer]
      ])
      .dispatch(playerActions.play({ uid: '123', trackId: 1, onEnd: () => {} }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.load).toHaveBeenCalled()
    expect(initialPlayer.play).toHaveBeenCalled()
  })

  it('plays by resuming', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchPlay)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          users: noopReducer(initialUsers),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          users: initialUsers,
          player: initialPlayer as unknown as PlayerState
        }
      )
      .provide([
        ...defaultProviders,
        [getContext('audioPlayer'), initialPlayer]
      ])
      .dispatch(playerActions.play({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.play).toHaveBeenCalled()
  })
})

describe('watchPause', () => {
  it('pauses', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPause)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer as unknown as PlayerState
        }
      )
      .provide([
        ...defaultProviders,
        [getContext('audioPlayer'), initialPlayer]
      ])
      .dispatch(playerActions.pause({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.pause).toHaveBeenCalled()
  })
})

describe('watchStop', () => {
  it('stops', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchStop)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer as unknown as PlayerState
        }
      )
      .provide([
        ...defaultProviders,
        [getContext('audioPlayer'), initialPlayer]
      ])
      .dispatch(playerActions.stop({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.stop).toHaveBeenCalled()
  })
})

describe('watchSeek', () => {
  it('seeks', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchSeek)
      .withReducer(
        combineReducers({
          tracks: noopReducer(initialTracks),
          player: playerReducer
        }),
        {
          tracks: initialTracks,
          player: initialPlayer as unknown as PlayerState
        }
      )
      .provide([
        ...defaultProviders,
        [getContext('audioPlayer'), initialPlayer]
      ])
      .dispatch(playerActions.seek({ seconds: 30 }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.seek).toHaveBeenCalledWith(30)
  })
})
