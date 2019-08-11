const assert = require('assert')
let helpers = require('./helpers')

let audiusInstance = helpers.audiusInstance

before(async function () {
  await audiusInstance.init()
})

it('should call getDiscoveryProvider on invalid value and verify blockchain is empty', async function () {
  let discprov = await audiusInstance.contracts.DiscoveryProviderFactoryClient.getDiscoveryProvider(-1)
  assert.strictEqual(discprov.endpoint, '')
})

it('should call register and verify new discovery provider endpoint', async function () {
  let endpoint = helpers.constants.creatorNodeURL1
  await audiusInstance.contracts.DiscoveryProviderFactoryClient.register(endpoint)

  let discprov = await audiusInstance.contracts.DiscoveryProviderFactoryClient.getDiscoveryProvider(1)
  assert.strictEqual(endpoint, discprov.endpoint)
})

it('should call register again and verify new discovery provider endpoint', async function () {
  let endpoint = helpers.constants.creatorNodeURL2
  await audiusInstance.contracts.DiscoveryProviderFactoryClient.register(endpoint)

  let discprov = await audiusInstance.contracts.DiscoveryProviderFactoryClient.getDiscoveryProvider(2)
  assert.strictEqual(endpoint, discprov.endpoint)
})

it('should get back a list of providers and verify the number and contents', async function () {
  let providers = await audiusInstance.contracts.DiscoveryProviderFactoryClient.getDiscoveryProviderList()
  assert.strictEqual(providers.length, 2)
  assert.strictEqual(providers[0], helpers.constants.creatorNodeURL1)
  assert.strictEqual(providers[1], helpers.constants.creatorNodeURL2)
})

it('should not register a bad url as a discovery provider', async function () {
  let endpoint = 'the cow jumped over the moon'
  let hitsTryBlock = false
  // calls register with an invalid endpoint to trigger the error
  try {
    await audiusInstance.contracts.registerDiscoveryProviderOnChain(endpoint)
    hitsTryBlock = true // if no error, then hitsTryBlock is set to true so that the test would not pass
  } catch (err) {
    // checks if the error is that specific error
    assert.strictEqual(err.message, 'Not a fully qualified domain name!')
  }
  assert.strictEqual(hitsTryBlock, false)
})

it('should register an endpoint that passes validation', async function () {
  let endpoint1 = 'http://discoveryprovider.audius.co'
  // do not depend on discovery provider being up to pass test; pass false in to skip
  // validating health check endpoint
  await audiusInstance.contracts.registerDiscoveryProviderOnChain(endpoint1, false)
  let discprov = await audiusInstance.contracts.DiscoveryProviderFactoryClient.getDiscoveryProvider(3)
  assert.strictEqual(discprov.endpoint, endpoint1)
})

it('should not register an endpoint with no health check.', async function () {
  let hitsTryBlock = false
  let endpoint2 = 'http://www.google.com'
  try {
    await audiusInstance.contracts.registerDiscoveryProviderOnChain(endpoint2)
    hitsTryBlock = true // if no error, then hitsTryBlock is set to true so that the test would not pass
  } catch (err) {
    // checks if the error is that specific error
    assert.strictEqual(err.message, 'Discovery provider failed health check. Provider could not be registered.')
  }
  assert.strictEqual(hitsTryBlock, false)
})
