const nock = require('nock')
const assert = require('assert')
const semver = require('semver')
const DiscoveryProviderSelection = require('./DiscoveryProviderSelection')
const DiscoveryProvider = require('.')
const helpers = require('../../../tests/helpers')
const { DISCOVERY_PROVIDER_TIMESTAMP } = require('./constants')
let audiusInstance = helpers.audiusInstance

const mockEthContracts = (urls, currrentVersion, previousVersions = null) => ({
  getCurrentVersion: async () => currrentVersion,
  getNumberOfVersions: async (spType) => 2,
  getVersion: async (spType, queryIndex) => {
    if (previousVersions) {
      return previousVersions[queryIndex]
    }
    return ['1.2.2', '1.2.3'][queryIndex]
  },
  getServiceProviderList: async () => urls.map(u => ({ endpoint: u })),
  hasSameMajorAndMinorVersion: (version1, version2) => {
    return (
      semver.major(version1) === semver.major(version2) &&
      semver.minor(version1) === semver.minor(version2)
    )
  },
  isInRegressedMode: () => {
    return false
  }
})

describe('DiscoveryProviderSelection', () => {
  beforeEach(() => {
    const LocalStorage = require('node-localstorage').LocalStorage
    const localStorage = new LocalStorage('./local-storage')
    localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
  })
  afterEach(() => {
    nock.cleanAll()
    audiusInstance = helpers.audiusInstance // reset libs
  })

  it('selects a healthy service', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy)
  })

  it('selects a healthy service with an unhealthy one present', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })
    const unhealthy = 'https://unhealthy.audius.co'
    nock(unhealthy)
      .get('/health_check')
      .reply(400, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy, unhealthy], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy)
  })

  it('prefers the correct vesion', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })
    const outdated = 'https://outdated.audius.co'
    nock(outdated)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy, outdated], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy)
  })

  it('prefers a healthy block diff', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })
    const behind = 'https://behind.audius.co'
    nock(behind)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 20
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy, behind], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy)
  })

  it('can select an old version', async () => {
    const healthyButBehind = 'https://healthyButBehind.audius.co'
    nock(healthyButBehind)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 20
      } })
    const pastVersionNotBehind = 'https://pastVersionNotBehind.audius.co'
    nock(pastVersionNotBehind)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      { requestTimeout: 100 },
      mockEthContracts([healthyButBehind, pastVersionNotBehind], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, pastVersionNotBehind)
    assert.deepStrictEqual(s.backups, {
      [healthyButBehind]: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 20
      },
      [pastVersionNotBehind]: {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 0
      }
    })
    assert.strictEqual(s.getTotalAttempts(), 2)
  })

  it('can select the discprov that is the least number of blocks behind for the current version', async () => {
    const behind20 = 'https://behind20.audius.co'
    nock(behind20)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 20
      } })
    const behind40 = 'https://behind40.audius.co'
    nock(behind40)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 40
      } })

    const s = new DiscoveryProviderSelection(
      { requestTimeout: 100 },
      mockEthContracts([behind20, behind40], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, behind20)
    assert.deepStrictEqual(s.backups, {
      [behind20]: {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 20
      },
      [behind40]: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 40
      }
    })
    assert.strictEqual(s.getTotalAttempts(), 2)
    assert.strictEqual(s.isInRegressedMode(), true)
  })

  it('can select the discprov that is the least number of blocks behind for past versions', async () => {
    const behind100 = 'https://behind100.audius.co'
    nock(behind100)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 100
      } })
    const behind200 = 'https://behind200.audius.co'
    nock(behind200)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 200
      } })

    const s = new DiscoveryProviderSelection(
      { requestTimeout: 100 },
      mockEthContracts(
        [behind100, behind200],
        '1.2.0',
        ['1.2.0']
      )
    )
    const service = await s.select()
    assert.strictEqual(service, behind100)
    assert.deepStrictEqual(s.backups, {
      [behind100]: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 100
      },
      [behind200]: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 200
      }
    })
    assert.strictEqual(s.getTotalAttempts(), 2)
    assert.strictEqual(s.isInRegressedMode(), true)
  })

  it('will not pick a minor version behind provider', async () => {
    const minorBehind = 'https://minorBehind.audius.co'
    nock(minorBehind)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.1.3',
        block_difference: 20
      } })
    const s = new DiscoveryProviderSelection(
      { requestTimeout: 100 },
      mockEthContracts([minorBehind], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, null)
  })

  it('respects a whitelist', async () => {
    const healthy1 = 'https://healthy1.audius.co'
    nock(healthy1)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const healthy2 = 'https://healthy2.audius.co'
    nock(healthy2)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {
        whitelist: new Set([healthy2])
      },
      mockEthContracts([healthy1, healthy2], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy2)
  })

  it('will cache its choice', async () => {
    const LocalStorage = require('node-localstorage').LocalStorage
    const localStorage = new LocalStorage('./local-storage')

    const healthy1 = 'https://healthy1.audius.co'
    nock(healthy1)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy1], '1.2.3')
    )
    const service = await s.select()
    assert.strictEqual(service, healthy1)
    const { endpoint } = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))
    assert.strictEqual(
      endpoint,
      healthy1
    )
  })

  it('will cache its choice and reuse it', async () => {
    const LocalStorage = require('node-localstorage').LocalStorage
    const localStorage = new LocalStorage('./local-storage')

    const healthy1 = 'https://healthy1.audius.co'
    nock(healthy1)
      .get('/health_check')
      .delay(100)
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const healthy2 = 'https://healthy2.audius.co'
    nock(healthy2)
      .get('/health_check')
      .delay(100)
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const initiallyUnhealthy = 'https://initiallyUnhealthy.audius.co'
    nock(initiallyUnhealthy)
      .get('/health_check')
      .reply(400, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const s = new DiscoveryProviderSelection(
      {},
      mockEthContracts([healthy1, healthy2, initiallyUnhealthy], '1.2.3')
    )
    const firstService = await s.select()
    const { endpoint } = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))
    assert.strictEqual(
      endpoint,
      firstService
    )

    const secondService = await s.select()
    assert.strictEqual(firstService, secondService)

    const thirdService = await s.select()
    assert.strictEqual(firstService, thirdService)

    const fourthService = await s.select()
    assert.strictEqual(firstService, fourthService)

    // Clear the cached service
    s.clearUnhealthy()
    localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)

    // Make healthy1 start failing but healthy2 succeed
    nock(healthy1)
      .get('/health_check')
      .reply(400, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })
    nock(healthy2)
      .get('/health_check')
      .reply(400, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })
    nock(initiallyUnhealthy)
      .get('/health_check')
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const fifthService = await s.select()
    assert.strictEqual(fifthService, initiallyUnhealthy)

    const sixthService = await s.select()
    assert.strictEqual(sixthService, initiallyUnhealthy)
  })

  it('will reselect a healthy disc prov if initialized disc prov becomes unhealthy', async () => {
    const LocalStorage = require('node-localstorage').LocalStorage
    const localStorage = new LocalStorage('./local-storage')

    // Make healthyThenUnhealthy respond with 200 initially
    const healthyThenUnhealthy = 'https://healthyThenUnhealthy.audius.co'
    const healthyThenUnhealthyInterceptor = nock(healthyThenUnhealthy)
      .persist()
      .get(uri => true) // hitting any route will respond with 200
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .persist()
      .get(uri => true)
      .delay(100)
      .reply(200, { data: {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0
      } })

    // Initialize libs and then set disc prov instance with eth contracts mock
    await audiusInstance.init()
    localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
    const mockDP = new DiscoveryProvider(
      null, // whitelist
      null, // blacklist
      audiusInstance.userStateManager,
      mockEthContracts([healthyThenUnhealthy, healthy], '1.2.3'),
      audiusInstance.web3Manager,
      null, // reselectTimeout
      null // selectionCallback
    )
    await mockDP.init()
    audiusInstance.discoveryProvider = mockDP

    // Check that healthyThenUnhealthy was chosen and set in local stoarge
    const discProvLocalStorageData1 = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))
    assert.strictEqual(audiusInstance.discoveryProvider.discoveryProviderEndpoint, healthyThenUnhealthy)
    assert.strictEqual(discProvLocalStorageData1.endpoint, healthyThenUnhealthy)

    // Then make healthyThenUnhealthy fail on successive requests
    // To remove any persistent interceptors: https://stackoverflow.com/a/59885361
    nock.removeInterceptor(healthyThenUnhealthyInterceptor.interceptors[0])
    nock(healthyThenUnhealthy)
      .persist()
      .get(uri => true)
      .reply(500, { unhealthy: true })

    // Make a libs request to disc prov; should use healthy
    await audiusInstance.discoveryProvider.getUsers(1)
    const discProvLocalStorageData2 = JSON.parse(localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP))

    // Check that healthy was chosen and set in local stoarge
    assert.strictEqual(audiusInstance.discoveryProvider.discoveryProviderEndpoint, healthy)
    assert.strictEqual(discProvLocalStorageData2.endpoint, healthy)
  })
})
