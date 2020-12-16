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
  it('Should pass', async function () {
    config.set('creatorNodeEndpoint', 'http://test.endpoint')
    config.set('spID', 10)
    let expectedEndpoint = config.get('creatorNodeEndpoint')
    let expectedSpID = config.get('spID')
    let expectedSpOwnerWallet = config.get('spOwnerWallet')
    const res = await healthCheck({ libs: libsMock }, mockLogger, sequelizeMock)
    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: TEST_ENDPOINT,
      spID: expectedSpID,
      spOwnerWallet: expectedSpOwnerWallet,
      creatorNodeEndpoint: expectedEndpoint
    })
  })

  it('Should handle no libs', async function () {
    const res = await healthCheck({}, mockLogger, sequelizeMock)
    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none',
      spID: config.get('spID'),
      spOwnerWallet: config.get('spOwnerWallet'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint')
    })
  })
})
