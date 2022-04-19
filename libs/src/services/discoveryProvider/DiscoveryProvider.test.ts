export {}
// const DiscoveryProvider = require('.')
// const helpers = require('../../../tests/helpers')
// const { DISCOVERY_PROVIDER_TIMESTAMP } = require('./constants')
//
// let audiusInstance = helpers.audiusInstance
//
//   // eslint-disable-next-line mocha/no-skipped-tests -- probably should be an integration test
//   xit('will reselect a healthy disc prov if initialized disc prov becomes unhealthy', async () => {
//     const LocalStorage = require('node-localstorage').LocalStorage
//     const localStorage = new LocalStorage('./local-storage')
//
//     // Make healthyThenUnhealthy respond with 200 initially
//     const healthyThenUnhealthy = 'https://healthyThenUnhealthy.audius.co'
//     const healthyThenUnhealthyInterceptor = nock(healthyThenUnhealthy)
//       .persist()
//       .get(uri => true) // hitting any route will respond with 200
//       .reply(200, {
//         data: {
//           service: 'discovery-node',
//           version: '1.2.3',
//           block_difference: 0
//         }
//       })
//
//     const healthy = 'https://healthy.audius.co'
//     nock(healthy)
//       .persist()
//       .get(uri => true)
//       .delay(100)
//       .reply(200, {
//         data: {
//           service: 'discovery-node',
//           version: '1.2.3',
//           block_difference: 0
//         }
//       })
//
//     // Initialize libs and then set disc prov instance with eth contracts mock
//     await audiusInstance.init()
//     localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
//     const mockDP = new DiscoveryProvider(
//       null, // whitelist
//       null, // blacklist
//       audiusInstance.userStateManager,
//       mockEthContracts([healthyThenUnhealthy, healthy], '1.2.3'),
//       audiusInstance.web3Manager,
//       null, // reselectTimeout
//       null // selectionCallback
//     )
//     await mockDP.init()
//     audiusInstance.discoveryProvider = mockDP
//
//     // Check that healthyThenUnhealthy was chosen and set in local stoarge
//     const discProvLocalStorageData1 = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))
//     assert.strictEqual(audiusInstance.discoveryProvider.discoveryProviderEndpoint, healthyThenUnhealthy)
//     assert.strictEqual(discProvLocalStorageData1.endpoint, healthyThenUnhealthy)
//
//     // Then make healthyThenUnhealthy fail on successive requests
//     // To remove any persistent interceptors: https://stackoverflow.com/a/59885361
//     nock.removeInterceptor(healthyThenUnhealthyInterceptor.interceptors[0])
//     nock(healthyThenUnhealthy)
//       .persist()
//       .get(uri => true)
//       .reply(500, { unhealthy: true })
//
//     // Make a libs request to disc prov; should use healthy
//     await audiusInstance.discoveryProvider.getUsers(1)
//     const discProvLocalStorageData2 = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))
//
//     // Check that healthy was chosen and set in local stoarge
//     assert.strictEqual(audiusInstance.discoveryProvider.discoveryProviderEndpoint, healthy)
//     assert.strictEqual(discProvLocalStorageData2.endpoint, healthy)
//   })
