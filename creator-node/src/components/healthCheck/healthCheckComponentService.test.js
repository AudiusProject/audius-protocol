const { healthCheck } = require('./healthCheck')
const assert = require('assert')
const version = require('../../../.version.json')

const TEST_ENDPOINT = 'test_endpoint'

const libsMock = {
  discoveryProvider: {
    discoveryProviderEndpoint: TEST_ENDPOINT
  }
}

describe('Test Health Check', function () {
  it('Should pass', function () {
    const res = healthCheck({ libs: libsMock })
    assert.deepStrictEqual(res, {
      ...version,
      service: 'creator-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: TEST_ENDPOINT
    })
  })

  it('Should handle no libs', function () {
    const res = healthCheck()
    assert.deepStrictEqual(res, {
      ...version,
      service: 'creator-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none'
    })
  })
})
