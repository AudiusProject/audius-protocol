const assert = require('assert')
const sinon = require('sinon')

const { sign, isWebhookValid } = require('./cognitoHelpers')
const config = require('../config')

describe('test cognitoHelpers', () => {
  beforeEach(() => {
    sinon.stub(config, 'get')
      .withArgs('cognitoAPISecret')
      .returns('live_secret_abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234')
      .withArgs('cognitoAPIKey')
      .returns('live_key_deadbeefcafedeadbeefcafedeadbeef')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('cognito signature returns the correctly signed data', () => {
    // Example lifted from documentation https://docs.cognitohq.com/guides#securing-your-flow-integration
    const signature = sign('3a409367-a417-4d46-9a92-3d7bc5dc4605')
    assert.strictEqual(signature, 'yw0hqBPOIWcHPFZBsaMPnxktOrWwWkZcWP+TneV5D48=')
  })

  it('webhook validation returns true when webhook is valid', () => {
    // Example lifted from documentation https://docs.cognitohq.com/guides#verifying-webhook-signatures
    const headers = {
      Date: 'Sat, 23 Jan 2021 21:43:14 GMT',
      Digest: 'SHA-256=xZI8wiAi5crBdZt7l10plN7Q8bScB6r/OV5PjxjKtTw=',
      Authorization: 'Signature keyId="live_key_deadbeefcafedeadbeefcafedeadbeef",algorithm="hmac-sha256",headers="(request-target) date digest",signature="PkvXq6CcH0d5HA7hiK5JWsA+e7G+7fuZPLtM2rMe4/8="'
    }
    assert.strictEqual(isWebhookValid(headers, '/webhook_receivers/flow'), true)
  })
})
