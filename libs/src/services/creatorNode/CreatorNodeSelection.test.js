const nock = require('nock')
const assert = require('assert')
const semver = require('semver')

const { CREATOR_NODE_SERVICE_NAME } = require('./constants')
const { CreatorNodeSelection } = require('./CreatorNodeSelection')

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

const mockCreatorNode = {
  getSyncStatus: async () => {
    return {
      isBehind: false,
      isConfigured: true
    }
  },
  monitoringCallbacks: {}
}

// Add fields as necessary
let defaultHealthCheckData = {
  'service': CREATOR_NODE_SERVICE_NAME,
  'version': '1.2.3',
  'healthy': true,
  'country': 'US',
  'latitude': '37.7749',
  'longitude': '-122.4194',
  'databaseConnections': 5,
  'totalMemory': 6237552640,
  'usedMemory': 6111436800,
  'storagePathSize': 62725623808,
  'storagePathUsed': 14723018752,
  'maxFileDescriptors': 524288,
  'allocatedFileDescriptors': 2912,
  'receivedBytesPerSec': 776.7638177541248,
  'transferredBytesPerSec': 39888.88888888889,
  'maxStorageUsedPercent': 95
}

describe('test CreatorNodeSelection', () => {
  it('selects the fastest healthy service as primary and rest as secondaries', async () => {
    const healthy = 'https://healthy.audius.co'

    nock(healthy)
      .get('/health_check/verbose')
      .reply(200, { data: defaultHealthCheckData })

    const healthyButSlow = 'https://healthybutslow.audius.co'
    nock(healthyButSlow)
      .get('/health_check/verbose')
      .delay(100)
      .reply(200, { data: defaultHealthCheckData })

    const healthyButSlowest = 'https://healthybutslowest.audius.co'
    nock(healthyButSlowest)
      .get('/health_check/verbose')
      .delay(200)
      .reply(200, { data: defaultHealthCheckData })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([healthy, healthyButSlow, healthyButSlowest], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries, services } = await cns.select()

    assert(primary === healthy)
    assert(secondaries.length === 2)
    assert(secondaries.includes(healthyButSlow))
    assert(secondaries.includes(healthyButSlowest))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 3)
    const healthyServices = [healthy, healthyButSlow, healthyButSlowest]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('select healthy nodes as the primary and secondary, and do not select unhealthy nodes', async () => {
    const upToDate = 'https://upToDate.audius.co'
    nock(upToDate)
      .get('/health_check/verbose')
      .reply(200, { data: defaultHealthCheckData })

    const behindMajor = 'https://behindMajor.audius.co'
    nock(behindMajor)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '0.2.3' } })

    const behindMinor = 'https://behindMinor.audius.co'
    nock(behindMinor)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.0.3' } })

    const behindPatch = 'https://behindPatch.audius.co'
    nock(behindPatch)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0' } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([upToDate, behindMajor, behindMinor, behindPatch], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries, services } = await cns.select()

    assert(primary === upToDate)
    assert(secondaries.length === 1)
    assert(secondaries.includes(behindPatch))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 2)
    const healthyServices = [upToDate, behindPatch]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('return nothing if no services are healthy', async () => {
    const unhealthy1 = 'https://unhealthy1.audius.co'
    nock(unhealthy1)
      .get('/health_check/verbose')
      .reply(500, { })

    const unhealthy2 = 'https://unhealthy2.audius.co'
    nock(unhealthy2)
      .get('/health_check/verbose')
      .delay(100)
      .reply(500, { })

    const unhealthy3 = 'https://unhealthy3.audius.co'
    nock(unhealthy3)
      .get('/health_check/verbose')
      .delay(200)
      .reply(500, { })

    const unhealthy4 = 'https://unhealthy4.audius.co'
    nock(unhealthy4)
      .get('/health_check/verbose')
      .delay(300)
      .reply(500, { })

    const unhealthy5 = 'https://unhealthy5.audius.co'
    nock(unhealthy5)
      .get('/health_check/verbose')
      .delay(400)
      .reply(500, { })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([unhealthy1, unhealthy2, unhealthy3, unhealthy4, unhealthy5], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries, services } = await cns.select()

    // All unhealthy are bad candidates so don't select anything
    assert(!primary)
    assert(secondaries.length === 0)

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 0)
  })

  it('selects the only healthy service among the services of different statuses', async () => {
    // the cream of the crop -- up to date version, slow. you want this
    const shouldBePrimary = 'https://shouldBePrimary.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .delay(200)
      .reply(200, { data: defaultHealthCheckData })

    // cold, overnight pizza -- behind by minor version, fast. nope
    const unhealthy2 = 'https://unhealthy2.audius.co'
    nock(unhealthy2)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.0.3' } })

    // stale chips from 2 weeks ago -- behind by major version, kinda slow. still nope
    const unhealthy3 = 'https://unhealthy3.audius.co'
    nock(unhealthy3)
      .get('/health_check/verbose')
      .delay(100)
      .reply(200, { data: { ...defaultHealthCheckData, version: '0.2.3' } })

    // moldy canned beans -- not available/up at all. for sure nope
    const unhealthy1 = 'https://unhealthy1.audius.co'
    nock(unhealthy1)
      .get('/health_check/verbose')
      .reply(500, { })

    // your house mate's leftovers from her team outing -- behind by patch, kinda slow. solid
    const shouldBeSecondary = 'https://secondary.audius.co'
    nock(shouldBeSecondary)
      .get('/health_check/verbose')
      .delay(100)
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0' } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([unhealthy1, shouldBePrimary, unhealthy2, unhealthy3, shouldBeSecondary], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries, services } = await cns.select()

    assert(primary === shouldBePrimary)
    assert(secondaries.length === 1)
    assert(secondaries.includes(shouldBeSecondary))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 2)
    const healthyServices = [shouldBePrimary, shouldBeSecondary]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  /**
   * This test is to ensure that the proper number of services is selected.
   * If numNodes = n, then (assuming all nodes are healthy):
   * - 1 primary is selected
   * - n-1 secondaries are selected
   * - n services are returned
   */
  it('selects numNodes - 1 number of secondaries (starting with numNodes=5->1)', async () => {
    const contentNodes = []
    const numNodes = 5
    for (let i = 0; i < numNodes; i++) {
      const healthyUrl = `https://healthy${i}.audius.co`
      nock(healthyUrl)
        .persist()
        .get('/health_check/verbose')
        .reply(200, { data: defaultHealthCheckData })
      contentNodes.push(healthyUrl)
    }

    let cns
    for (let i = 0; i < numNodes; i++) {
      cns = new CreatorNodeSelection({
        creatorNode: mockCreatorNode,
        numberOfNodes: numNodes - i,
        ethContracts: mockEthContracts(contentNodes, '1.2.3'),
        whitelist: null,
        blacklist: null
      })

      const { primary, secondaries, services } = await cns.select()
      assert(primary)
      assert(secondaries.length === numNodes - i - 1)
      const returnedHealthyServices = Object.keys(services)
      assert(returnedHealthyServices.length === numNodes)
    }
  })

  it('selects 1 secondary if only 1 secondary is available', async () => {
    const shouldBePrimary = 'https://shouldBePrimary.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .delay(200)
      .reply(200, { data: defaultHealthCheckData })

    const shouldBeSecondary = 'https://secondary.audius.co'
    nock(shouldBeSecondary)
      .get('/health_check/verbose')
      .delay(100)
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0' } })

    const unhealthy = 'https://unhealthy.audius.co'
    nock(unhealthy)
      .get('/health_check/verbose')
      .reply(500, { })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([unhealthy, shouldBePrimary, shouldBeSecondary], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries, services } = await cns.select()

    assert(primary === shouldBePrimary)
    assert(secondaries.length === 1)
    assert(secondaries.includes(shouldBeSecondary))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 2)
    const healthyServices = [shouldBePrimary, shouldBeSecondary]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('filters out nodes if over 95% of storage is used', async () => {
    const shouldBePrimary = 'https://primary.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary1 = 'https://secondary1.audius.co'
    nock(shouldBeSecondary1)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.1', storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary2 = 'https://secondary2.audius.co'
    nock(shouldBeSecondary2)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0', storagePathUsed: 30, storagePathSize: 100 } })

    const used95PercentStorage = 'https://used95PercentStorage.audius.co'
    nock(used95PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, storagePathUsed: 95.354, storagePathSize: 100 } })

    const used99PercentStorage = 'https://used99PercentStorage.audius.co'
    nock(used99PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, storagePathUsed: 99, storagePathSize: 100 } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2, used95PercentStorage, used99PercentStorage], '1.2.3'),
      whitelist: null,
      blacklist: null
    })
    assert(cns.maxStorageUsedPercent === 95)

    const { primary, secondaries, services } = await cns.select()

    assert(cns.maxStorageUsedPercent === 95)
    assert(primary === shouldBePrimary)
    assert(secondaries.length === 2)
    assert(secondaries.includes(shouldBeSecondary1))
    assert(secondaries.includes(shouldBeSecondary2))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 3)
    const healthyServices = [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('overrides with health check resp `maxStorageUsedPercent` even if it is passed into constructor', async () => {
    const shouldBePrimary = 'https://primary.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary1 = 'https://secondary1.audius.co'
    nock(shouldBeSecondary1)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.2', storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary2 = 'https://secondary2.audius.co'
    nock(shouldBeSecondary2)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.1', storagePathUsed: 30, storagePathSize: 100 } })

    const used50PercentStorage = 'https://used95PercentStorage.audius.co'
    nock(used50PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0', storagePathUsed: 50, storagePathSize: 100 } })

    const used70PercentStorage = 'https://used70PercentStorage.audius.co'
    nock(used70PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...defaultHealthCheckData, version: '1.2.0', storagePathUsed: 70.546, storagePathSize: 100 } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts(
        [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2, used50PercentStorage, used70PercentStorage],
        '1.2.3'
      ),
      whitelist: null,
      blacklist: null,
      maxStorageUsedPercent: 50
    })

    assert(cns.maxStorageUsedPercent === 50)

    const { primary, secondaries, services } = await cns.select()

    assert(cns.maxStorageUsedPercent === 95)

    assert(primary === shouldBePrimary)
    assert(secondaries.length === 2)
    assert(secondaries.includes(shouldBeSecondary1))
    assert(secondaries.includes(shouldBeSecondary2))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 5)
    const healthyServices = [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('allows custom maxStorageUsedPercent as constructor param if `maxStorageUsedPercent` is not found in health check resp', async () => {
    let healthCheckResponseWithNoMaxStorageUsedPercent = { ...defaultHealthCheckData }
    delete healthCheckResponseWithNoMaxStorageUsedPercent.maxStorageUsedPercent

    const shouldBePrimary = 'https://primary.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckResponseWithNoMaxStorageUsedPercent, storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary1 = 'https://secondary1.audius.co'
    nock(shouldBeSecondary1)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckResponseWithNoMaxStorageUsedPercent, version: '1.2.1', storagePathUsed: 30, storagePathSize: 100 } })

    const shouldBeSecondary2 = 'https://secondary2.audius.co'
    nock(shouldBeSecondary2)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckResponseWithNoMaxStorageUsedPercent, version: '1.2.0', storagePathUsed: 30, storagePathSize: 100 } })

    const used50PercentStorage = 'https://used95PercentStorage.audius.co'
    nock(used50PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckResponseWithNoMaxStorageUsedPercent, storagePathUsed: 50, storagePathSize: 100 } })

    const used70PercentStorage = 'https://used70PercentStorage.audius.co'
    nock(used70PercentStorage)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckResponseWithNoMaxStorageUsedPercent, storagePathUsed: 70.546, storagePathSize: 100 } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts(
        [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2, used50PercentStorage, used70PercentStorage],
        '1.2.3'
      ),
      whitelist: null,
      blacklist: null,
      maxStorageUsedPercent: 50
    })

    assert(cns.maxStorageUsedPercent === 50)

    const { primary, secondaries, services } = await cns.select()

    assert(cns.maxStorageUsedPercent === 50)
    assert(primary === shouldBePrimary)
    assert(secondaries.length === 2)
    assert(secondaries.includes(shouldBeSecondary1))
    assert(secondaries.includes(shouldBeSecondary2))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 3)
    const healthyServices = [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('allows Content Node to be selected if storage information is unavailable (undefined or null)', async () => {
    const healthCheckDataWithNoStorageInfo = {
      ...defaultHealthCheckData
    }
    delete healthCheckDataWithNoStorageInfo.storagePathSize
    healthCheckDataWithNoStorageInfo.storagePathUsed = null

    const shouldBePrimary = 'https://missingStoragePathUsedAndStoragePathSize.audius.co'
    nock(shouldBePrimary)
      .get('/health_check/verbose')
      .reply(200, { data: healthCheckDataWithNoStorageInfo })

    const shouldBeSecondary1 = 'https://missingStoragePathUsed.audius.co'
    nock(shouldBeSecondary1)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckDataWithNoStorageInfo, version: '1.2.1', storagePathSize: 100 } })

    const shouldBeSecondary2 = 'https://missingStoragePathSize.audius.co'
    nock(shouldBeSecondary2)
      .get('/health_check/verbose')
      .reply(200, { data: { ...healthCheckDataWithNoStorageInfo, version: '1.2.0', storagePathUsed: 30 } })

    const cns = new CreatorNodeSelection({
      creatorNode: mockCreatorNode,
      numberOfNodes: 3,
      ethContracts: mockEthContracts(
        [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2],
        '1.2.3'
      ),
      whitelist: null,
      blacklist: null,
      maxStorageUsedPercent: 50
    })

    const { primary, secondaries, services } = await cns.select()

    assert(primary === shouldBePrimary)
    assert(secondaries.length === 2)
    assert(secondaries.includes(shouldBeSecondary1))
    assert(secondaries.includes(shouldBeSecondary2))

    const returnedHealthyServices = new Set(Object.keys(services))
    assert(returnedHealthyServices.size === 3)
    const healthyServices = [shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2]
    healthyServices.map(service => assert(returnedHealthyServices.has(service)))
  })

  it('does not always pick the same one with equivalency delta', async () => {
    // Run this test a few times and make sure we eventually get something
    // different
    let primaries = []
    for (let i = 0; i < 20; ++i) {
      const one = 'https://one.audius.co'
      nock(one)
        .get('/health_check/verbose')
        .delay(100)
        .reply(200, { data: defaultHealthCheckData })

      const two = 'https://two.audius.co'
      nock(two)
        .get('/health_check/verbose')
        .delay(200)
        .reply(200, { data: defaultHealthCheckData })

      const cns = new CreatorNodeSelection({
        creatorNode: mockCreatorNode,
        numberOfNodes: 2,
        ethContracts: mockEthContracts([one, two], '1.2.3'),
        whitelist: null,
        blacklist: null,
        // Even though one and two take 100ms and 200ms respectively,
        // we consider 200ms equivalent, so they should be randomly picked
        equivalencyDelta: 200
      })

      const { primary } = await cns.select()
      primaries.push(primary)
    }
    // Make sure there is some variance
    assert(!primaries.every(val => val === primaries[0]))
  }).timeout(10000)
})
