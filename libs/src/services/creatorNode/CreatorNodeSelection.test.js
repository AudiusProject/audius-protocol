const nock = require('nock')
const assert = require('assert')
const semver = require('semver')

const { CREATOR_NODE_SERVICE_NAME } = require('./constants')
const CreatorNodeSelection = require('./CreatorNodeSelection')

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

describe('test CreatorNodeSelection', () => {
  it('sorts by descending semver', () => {
    const cns = new CreatorNodeSelection({
      creatorNode: null,
      numberOfNodes: 3,
      ethContracts: mockEthContracts([], '1.2.3'),
      whitelist: null,
      blacklist: null
    })
    const services = [{
      endpoint: 'creator_node_1.com',
      version: '4.30.95',
      responseTime: 100 // ms
    },
    {
      endpoint: 'creator_node_2.com',
      version: '10.13.95',
      responseTime: 100 // ms
    },
    {
      endpoint: 'creator_node_3.com',
      version: '10.23.20',
      responseTime: 100 // ms
    }]

    const sortedServices = cns.sortBySemver(services)

    assert(sortedServices[0].version === '10.23.20')
    assert(sortedServices[1].version === '10.13.95')
    assert(sortedServices[2].version === '4.30.95')
  })

  it('sorts by ascending time,', () => {
    const cns = new CreatorNodeSelection({
      creatorNode: null,
      numberOfNodes: 3,
      ethContracts: mockEthContracts,
      whitelist: null,
      blacklist: null
    })

    const services = [{
      endpoint: 'creator_node_1.com',
      version: '4.30.95',
      responseTime: 100 // ms
    },
    {
      endpoint: 'creator_node_2.com',
      version: '4.30.95',
      responseTime: 200 // ms
    },
    {
      endpoint: 'creator_node_3.com',
      version: '4.30.95',
      responseTime: 300 // ms
    }]

    const sortedServices = cns.sortBySemver(services)

    assert(sortedServices[0].responseTime === 100)
    assert(sortedServices[1].responseTime === 200)
    assert(sortedServices[2].responseTime === 300)
  })

  it('selects the fastest healthy service as primary and rest secondaries', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/health_check')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const healthyButSlow = 'https://healthybutslow.audius.co'
    nock(healthyButSlow)
      .get('/health_check')
      .delay(100)
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const healthyButSlowest = 'https://healthybutslowest.audius.co'
    nock(healthyButSlowest)
      .get('/health_check')
      .delay(200)
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const cns = new CreatorNodeSelection({
      // Mock Creator Node
      creatorNode: {
        getSyncStatus: async () => {
          return {
            isBehind: false,
            isConfigured: true
          }
        }
      },
      numberOfNodes: 3,
      ethContracts: mockEthContracts([healthy, healthyButSlow, healthyButSlowest], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries } = await cns.select()

    assert(primary === healthy)
    assert(secondaries.length === 2)
    assert(!secondaries.includes(primary))
    assert(secondaries.includes(healthyButSlow))
    assert(secondaries.includes(healthyButSlowest))
  })

  it('filter out behind creator nodes, select the highest version as primary and rest as secondaries', async () => {
    const upToDate = 'https://upToDate.audius.co'
    nock(upToDate)
      .get('/health_check')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindMajor = 'https://behindMajor.audius.co'
    nock(behindMajor)
      .get('/health_check')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '0.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindMinor = 'https://behindMinor.audius.co'
    nock(behindMinor)
      .get('/health_check')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.0.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindPatch = 'https://behindPatch.audius.co'
    nock(behindPatch)
      .get('/health_check')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.0',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const cns = new CreatorNodeSelection({
      // Mock Creator Node
      creatorNode: {
        getSyncStatus: async () => {
          return {
            isBehind: false,
            isConfigured: true
          }
        }
      },
      numberOfNodes: 2,
      ethContracts: mockEthContracts([upToDate, behindMajor, behindMinor, behindPatch], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries } = await cns.select()

    assert(primary === upToDate)
    assert(secondaries.length === 1)
    assert(!secondaries.includes(primary))
    assert(secondaries.includes(behindPatch))
  })
})
