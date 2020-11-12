const { healthCheck } = require('./healthCheckComponentService')
const assert = require('assert')
const version = require('../../../.version.json')
const config = require('../../../src/config')

const TEST_ENDPOINT = 'test_endpoint'

const libsMock = {
  discoveryProvider: {
    discoveryProviderEndpoint: TEST_ENDPOINT
  }
}

const sequelizeMock = {
  'query': async () => Promise.resolve()
}

const mockLogger = {
  warn: () => {}
}

describe('Test Health Check', function () {
  before(async function () {
    config.set('creatorNodeEndpoint', 'http://test.endpoint')
    config.set('spID', 10)
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '1')
    config.set('serviceLongitude', '2')
  })

  it('Should pass', async function () {
    let expectedEndpoint = config.get('creatorNodeEndpoint')
    let expectedSpID = config.get('spID')
    const res = await healthCheck({ libs: libsMock }, mockLogger, sequelizeMock)
    assert.deepStrictEqual(res, {
      ...version,
      service: 'creator-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: TEST_ENDPOINT,
      spID: expectedSpID,
      creatorNodeEndpoint: expectedEndpoint,
      country: 'US',
      latitude: '1',
      longitude: '2'
    })
  })

  it('Should handle no libs', async function () {
    const res = await healthCheck({}, mockLogger, sequelizeMock)
    assert.deepStrictEqual(res, {
      ...version,
      service: 'creator-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none',
      spID: config.get('spID'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
      country: config.get('serviceCountry'),
      latitude: config.get('serviceLatitude'),
      longitude: config.get('serviceLongitude')
    })
  })
})
