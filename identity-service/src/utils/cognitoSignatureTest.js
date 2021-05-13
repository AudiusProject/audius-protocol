const assert = require('assert')
const sinon = require('sinon')

const { sign } = require('./cognitoSignature')
const config = require('../config')

describe('test cognitoSignature', () => {
  beforeEach(() => {
    sinon.stub(config, 'get')
      .withArgs('cognitoAPISecret')
      .returns('live_secret_abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234')
  })

  it('returns the correctly signed data', () => {
    // Example lifted from documentation https://docs.cognitohq.com/guides#supplementing-email
    const signature = sign('3a409367-a417-4d46-9a92-3d7bc5dc4605')
    assert.strictEqual(signature, 'yw0hqBPOIWcHPFZBsaMPnxktOrWwWkZcWP+TneV5D48=')
  })
})
