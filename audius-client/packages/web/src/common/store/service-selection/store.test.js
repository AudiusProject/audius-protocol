import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { noopReducer } from 'store/testHelper'

import * as sagas from './sagas'
import reducer, { fetchServices } from './slice'

const initialState = {
  // Service name => {country, latitude, longitude, ping, isSyncing}
  services: {},
  primary: null,
  secondaries: [null, null],
  status: null,
  showModal: false
}

const service1URL = 'http://test_endpoint1'
const service2URL = 'http://test_endpoint2'

const service1 = {
  country: 'US',
  data: {
    latitude: '45.5235',
    longitude: '-122.6762',
    service: 'content-node',
    version: '0.3.17'
  },
  latitude: '45.5235',
  longitude: '-122.6762',
  service: 'content-node',
  signature:
    '0x71c58c20ff6e9e44cf7a590a5bed05005f25ed5e4c4ec4080d02ccbdfc057c39658c84c6f5bfd9c10476b0422ce02202b3388275d4a07e9ceeeb341b848d76ac1b',
  signer: '0xd97afD61e49d633DC87C4894F432d8e76a4A61EE',
  timestamp: '2020-08-12T01:17:53.548Z',
  version: '0.3.17'
}

const service2 = {
  country: 'US',
  data: {
    latitude: '46.5235',
    longitude: '-123.6762',
    service: 'content-node',
    version: '0.3.17'
  },
  latitude: '46.5235',
  longitude: '-123.6762',
  service: 'content-node',
  signature:
    '0x71c58c20ff6e9e44cf7a590a5bed05005f25ed5e4c4ec4080d02ccbdfc057c39658c84c6f5bfd9c10476b0422ce02202b3388275d4a07e9ceeeb341b848d76ac1b',
  signer: '0xd97afD61e49d633DC87C4894F432d8e76a4A61EE',
  timestamp: '2020-08-12T01:17:53.548Z',
  version: '0.3.17'
}

const expectedState = {
  services: {
    [service1URL]: service1,
    [service2URL]: { ...service2, isSyncing: true }
  },
  primary: service1URL,
  secondaries: [service2URL],
  status: 'SUCCESS',
  showModal: false
}

describe('fetchServices', () => {
  it('Happy path, all selectable', async () => {
    const { storeState } = await expectSaga(sagas.watchFetchServices)
      .withReducer(
        combineReducers({
          serviceSelection: reducer,
          account: noopReducer(),
          users: noopReducer()
        }),
        {
          serviceSelection: initialState,
          account: {
            userId: 1
          },
          users: {
            entries: {
              1: {
                metadata: {
                  creator_node_endpoint:
                    'http://test_endpoint1,http://test_endpoint2'
                }
              }
            }
          }
        }
      )
      .provide([
        [matchers.call.fn(waitForBackendSetup), true],
        [
          matchers.call.fn(audiusBackendInstance.getSelectableCreatorNodes),
          {
            'http://test_endpoint1': service1,
            'http://test_endpoint2': service2
          }
        ]
      ])
      .dispatch(fetchServices())
      .silentRun()

    expect(storeState.serviceSelection).toEqual(expectedState)
  })
})
