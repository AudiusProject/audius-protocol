import { Kind } from '@audius/common/models'
import {
  cacheReducer,
  lineupReducer,
  LineupBaseActions,
  queueReducer,
  initialQueueState,
  playerReducer,
  initialPlayerState
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { all } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { describe, it, beforeAll, expect, vitest } from 'vitest'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import cacheSagas from 'common/store/cache/sagas'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { LineupSagas } from 'common/store/lineup/sagas'
import { noopReducer, allSagas } from 'store/testHelper'

const { asLineup, initialLineupState } = lineupReducer
const { asCache, initialCacheState } = cacheReducer

const initialConfirmerState = {
  confirm: {},
  complete: {},
  operationSuccessCallIdx: {}
}

const PREFIX = 'tracks'
const MOCK_TIMESTAMP = 1479427200000

function* getTracks() {
  const tracks = yield all([
    {
      track_id: 1,
      owner_id: 1,
      keep_in_lineup: 11
    },
    {
      track_id: 2,
      owner_id: 1,
      keep_in_lineup: 22
    },
    {
      track_id: 3,
      owner_id: 2,
      keep_in_lineup: 33
    },
    {
      track_id: 4,
      owner_id: 2,
      keep_in_lineup: 44
    }
  ])
  return tracks
}

class Actions extends LineupBaseActions {
  constructor() {
    super(PREFIX)
  }
}
const actions = new Actions()

class Sagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      actions,
      // Selector to fetch the lineup.
      (state) => state.lineup,
      // Query to fetch remote tracks (e.g. from BE).
      getTracks,
      // Selector of what to keep in the lineup.
      (track) => ({
        id: track.track_id,
        keepInLineup: track.keep_in_lineup
      }),
      /* removeDeleted */ false
    )
  }
}
const sagas = new Sagas()

beforeAll(() => {
  vitest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
})

describe('fetch', () => {
  it('fetches and add tracks to the lineup', async () => {
    const { storeState } = await expectSaga(
      allSagas(sagas.getSagas().concat(cacheSagas())),
      actions
    )
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          queue: queueReducer,
          tracks: asCache(noopReducer(), Kind.TRACKS),
          users: asCache(noopReducer(), Kind.USERS),
          collections: asCache(noopReducer(), Kind.COLECTIONS),
          confirmer: noopReducer()
        }),
        {
          lineup: {
            ...initialLineupState
          },
          queue: {
            ...initialQueueState
          },
          tracks: {
            ...initialCacheState
          },
          users: {
            ...initialCacheState
          },
          collections: {
            ...initialCacheState
          },
          confirmer: {
            ...initialConfirmerState
          }
        }
      )
      .provide([
        [matchers.call.fn(waitForBackendSetup), true],
        [matchers.call.fn(fetchUsers), []]
      ])
      .dispatch(actions.fetchLineupMetadatas())
      .silentRun()
    expect(storeState.lineup.entries).toEqual([
      {
        id: 1,
        uid: 'kind:TRACKS-id:1-count:1',
        keepInLineup: 11
      },
      {
        id: 2,
        uid: 'kind:TRACKS-id:2-count:2',
        keepInLineup: 22
      },
      {
        id: 3,
        uid: 'kind:TRACKS-id:3-count:3',
        keepInLineup: 33
      },
      {
        id: 4,
        uid: 'kind:TRACKS-id:4-count:4',
        keepInLineup: 44
      }
    ])
    expect(storeState.tracks).toEqual({
      ...initialCacheState,
      uids: {
        'kind:TRACKS-id:1-count:1': 1,
        'kind:TRACKS-id:2-count:2': 2,
        'kind:TRACKS-id:3-count:3': 3,
        'kind:TRACKS-id:4-count:4': 4
      },
      subscribers: {
        1: new Set(['kind:TRACKS-id:1-count:1']),
        2: new Set(['kind:TRACKS-id:2-count:2']),
        3: new Set(['kind:TRACKS-id:3-count:3']),
        4: new Set(['kind:TRACKS-id:4-count:4'])
      }
    })
  })
})

describe('play', () => {
  it('adds all tracks to the queue', async () => {
    const { storeState } = await expectSaga(allSagas(sagas.getSagas()), actions)
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          tracks: noopReducer(),
          queue: queueReducer,
          player: playerReducer
        }),
        {
          lineup: {
            ...initialLineupState,
            entries: [
              { id: 1, uid: 'kind:TRACKS-id:1-count:1', kind: Kind.TRACKS },
              { id: 2, uid: 'kind:TRACKS-id:2-count:2', kind: Kind.TRACKS },
              { id: 3, uid: 'kind:TRACKS-id:3-count:3', kind: Kind.TRACKS },
              { id: 4, uid: 'kind:TRACKS-id:4-count:4', kind: Kind.TRACKS }
            ],
            order: {
              'kind:TRACKS-id:1-count:1': 0,
              'kind:TRACKS-id:2-count:2': 1,
              'kind:TRACKS-id:3-count:3': 2,
              'kind:TRACKS-id:4-count:4': 3
            },
            prefix: PREFIX
          },
          tracks: {
            ...initialCacheState,
            entries: {
              1: { metadata: { track_id: 1, keep_in_lineup: 11 } },
              2: { metadata: { track_id: 2, keep_in_lineup: 22 } },
              3: { metadata: { track_id: 3, keep_in_lineup: 33 } },
              4: { metadata: { track_id: 4, keep_in_lineup: 44 } }
            },
            uids: {
              'kind:TRACKS-id:1-count:1': 1,
              'kind:TRACKS-id:2-count:2': 2,
              'kind:TRACKS-id:3-count:3': 3,
              'kind:TRACKS-id:4-count:4': 4
            },
            subscribers: {
              1: new Set(['kind:TRACKS-id:1-count:1']),
              2: new Set(['kind:TRACKS-id:2-count:2']),
              3: new Set(['kind:TRACKS-id:3-count:3']),
              4: new Set(['kind:TRACKS-id:4-count:4'])
            }
          },
          queue: {
            ...initialQueueState
          },
          player: {
            ...initialPlayerState
          }
        }
      )
      .dispatch(actions.play('kind:TRACKS-id:2-count:2'))
      .silentRun()
    expect(storeState.queue.order).toEqual([
      { id: 1, uid: 'kind:TRACKS-id:1-count:1', source: PREFIX },
      { id: 2, uid: 'kind:TRACKS-id:2-count:2', source: PREFIX },
      { id: 3, uid: 'kind:TRACKS-id:3-count:3', source: PREFIX },
      { id: 4, uid: 'kind:TRACKS-id:4-count:4', source: PREFIX }
    ])
    expect(storeState.queue.index).toEqual(1)
  })
})
