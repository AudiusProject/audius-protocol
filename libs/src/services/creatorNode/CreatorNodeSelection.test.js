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
  it('selects the fastest healthy service as primary and rest as secondaries', async () => {
    const healthy = 'https://healthy.audius.co'
    nock(healthy)
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const healthyButSlow = 'https://healthybutslow.audius.co'
    nock(healthyButSlow)
      .get('/version')
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
      .get('/version')
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
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindMajor = 'https://behindMajor.audius.co'
    nock(behindMajor)
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '0.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindMinor = 'https://behindMinor.audius.co'
    nock(behindMinor)
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.0.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    const behindPatch = 'https://behindPatch.audius.co'
    nock(behindPatch)
      .get('/version')
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

  it('select from unhealthy if all are unhealthy', async () => {
    const unhealthy1 = 'https://unhealthy1.audius.co'
    nock(unhealthy1)
      .get('/version')
      .reply(500, { })

    const unhealthy2 = 'https://unhealthy2.audius.co'
    nock(unhealthy2)
      .get('/version')
      .delay(100)
      .reply(500, { })

    const unhealthy3 = 'https://unhealthy3.audius.co'
    nock(unhealthy3)
      .get('/version')
      .delay(200)
      .reply(500, { })

    const unhealthy4 = 'https://unhealthy4.audius.co'
    nock(unhealthy4)
      .get('/version')
      .delay(300)
      .reply(500, { })

    const unhealthy5 = 'https://unhealthy5.audius.co'
    nock(unhealthy5)
      .get('/version')
      .delay(400)
      .reply(500, { })

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
      .get('/version')
      .delay(200)
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    // cold, overnight pizza -- behind by minor version, fast. nope
    const unhealthy2 = 'https://unhealthy2.audius.co'
    nock(unhealthy2)
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.0.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    // stale chips from 2 weeks ago -- behind by major version, kinda slow. still nope
    const unhealthy3 = 'https://unhealthy3.audius.co'
    nock(unhealthy3)
      .get('/version')
      .delay(100)
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '0.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    // moldy canned beans -- not available/up at all. for sure nope
    const unhealthy1 = 'https://unhealthy1.audius.co'
    nock(unhealthy1)
      .get('/version')
      .reply(500, { })

    // your house mate's leftovers from her team outing -- behind by patch, kinda slow. solid
    const shouldBeSecondary = 'https://secondary.audius.co'
    nock(shouldBeSecondary)
      .get('/version')
      .delay(100)
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
        .get('/version')
        .reply(200, { data: {
          service: CREATOR_NODE_SERVICE_NAME,
          version: '1.2.3',
          country: 'US',
          latitude: '37.7058',
          longitude: '-122.4619'
        } })
      contentNodes.push(healthyUrl)
    }

    let cns
    for (let i = 0; i < numNodes; i++) {
      cns = new CreatorNodeSelection({
      // Mock Creator Node
        creatorNode: {
          getSyncStatus: async () => {
            return {
              isBehind: false,
              isConfigured: true
            }
          }
        },
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
})
