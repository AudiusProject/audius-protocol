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

    const { primary, secondaries } = await cns.select()

    assert(primary === upToDate)
    assert(secondaries.length === 2)
    assert(!secondaries.includes(primary))
    assert(secondaries.includes(behindPatch))
    assert(secondaries.includes(behindMinor))
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

    const { primary, secondaries } = await cns.select()

    // All unhealthy are bad candidates so just pick whatever if all are unhealthy
    assert(primary !== undefined && primary !== null)
    assert(secondaries.length === 2)
    assert(secondaries[0] !== null && secondaries[0] !== undefined)
    assert(secondaries[1] !== null && secondaries[1] !== undefined)
  })

  it('selects the healthiest among the services of different statuses', async () => {
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

    // cold, overnight pizza -- behind by minor version, fast. you kind of want this
    const shouldBeSecondary1 = 'https://shouldBeSecondary1.audius.co'
    nock(shouldBeSecondary1)
      .get('/version')
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '1.0.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    // stale chips from 2 weeks ago -- behind by major version, kinda slow.
    // you kind of don't want this but only if there is nothing better
    const shouldBeSecondary2 = 'https://shouldBeSecondary2.audius.co'
    nock(shouldBeSecondary2)
      .get('/version')
      .delay(100)
      .reply(200, { data: {
        service: CREATOR_NODE_SERVICE_NAME,
        version: '0.2.3',
        country: 'US',
        latitude: '37.7058',
        longitude: '-122.4619'
      } })

    // moldy canned beans -- not available/up at all
    // you should never pick this unless you are SOL
    const unhealthy1 = 'https://unhealthy1.audius.co'
    nock(unhealthy1)
      .get('/version')
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
      ethContracts: mockEthContracts([unhealthy1, shouldBePrimary, shouldBeSecondary1, shouldBeSecondary2], '1.2.3'),
      whitelist: null,
      blacklist: null
    })

    const { primary, secondaries } = await cns.select()

    assert(primary === shouldBePrimary)
    assert(secondaries.length === 2)
    assert(!secondaries.includes(primary))
    assert(secondaries.includes(shouldBeSecondary1))
    assert(secondaries.includes(shouldBeSecondary2))
  })

  it('selects numNodes - 1 number of secondaries (numNodes = 5)', async () => {
    const services = []
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
      services.push(healthyUrl)
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
        ethContracts: mockEthContracts(services, '1.2.3'),
        whitelist: null,
        blacklist: null
      })

      const { secondaries } = await cns.select()
      // Should be 4, 3, 2, 1
      assert(secondaries.length === numNodes - i - 1)
    }
  })
})
