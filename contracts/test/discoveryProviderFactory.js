import * as _lib from './_lib/lib.js'
import {
  Registry,
  DiscoveryProviderStorage,
  DiscoveryProviderFactory
} from './_lib/artifacts.js'

contract('DiscoveryProviderFactory', async (accounts) => {
  let endpoints = [
    'lil',
    'dicky',
    'http://discprov.s.audius.co/',
    'http://audius-discprov-alpha-v2-lb-1680639124.us-west-1.elb.amazonaws.com'
  ]
  let discprovId = 1
  let registry, discoveryProviderStorage, discoveryProviderFactory

  beforeEach(async () => {
    registry = await Registry.new()
    discoveryProviderStorage = await DiscoveryProviderStorage.new(registry.address)
    await registry.addContract(_lib.discoveryProviderStorageKey, discoveryProviderStorage.address)
    discoveryProviderFactory = await DiscoveryProviderFactory.new(registry.address, _lib.discoveryProviderStorageKey)
    await registry.addContract(_lib.discoveryProviderFactoryKey, discoveryProviderFactory.address)
  })

  it('Should register one discovery provider', async () => {
    // add discprov
    let tx = await discoveryProviderFactory.register(endpoints[3])

    // validate event output matches transaction input
    let event = _lib.validateDiscprovRegisterEvent(tx, discprovId, accounts[0], endpoints[3])

    // retrieve discprov from contract
    let discprov = await _lib.getDiscprovFromFactory(event.discprovId, discoveryProviderFactory)

    // validate retrieved discprov fields match transaction inputs
    _lib.validateRegisteredDiscprov(discprov, accounts[0], endpoints[3])
  })

  it('Should retrieve all registered discovery providers', async () => {
    // add a bunch of endpoints
    let transactions = []
    let i = 0
    for (i = 0; i < endpoints.length; i++) {
      transactions[i] = await discoveryProviderFactory.register(endpoints[i])
    }

    // validate event outputs match transaction inputs
    for (i = 0; i < endpoints.length; i++) {
      _lib.validateDiscprovRegisterEvent(
        transactions[i],
        i + 1,
        accounts[0],
        endpoints[i]
      )
    }

    // validate total number of discprovs match input number of endpoints
    let totalProviders = await discoveryProviderFactory.getTotalNumberOfProviders.call()
    assert.equal(totalProviders, endpoints.length)

    // retrieve all discprovs from file
    let discProvList = []
    for (i = 0; i < totalProviders; i++) {
      discProvList[i] = await discoveryProviderFactory.getDiscoveryProvider(i + 1)
    }

    // validate retrieved discprov list match input list
    for (i = 0; i < endpoints.length; i++) {
      assert.equal(
        discProvList[i][0],
        accounts[0],
        'Expected same discprov wallet address'
      )
      assert.equal(
        discProvList[i][1],
        endpoints[i],
        'Expected same discprov endpoints'
      )
    }
  })
})
