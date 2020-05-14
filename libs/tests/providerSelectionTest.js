const assert = require('assert')
const sinon = require('sinon')

const ContractClient = require('../src/services/contracts/ContractClient')
const Web3Manager = require('../src/services/web3Manager/index')
const EthWeb3Manager = require('../src/services/ethWeb3Manager/index')
const Web3 = require('web3')

let contractClient

function createWeb3Obj (host) {
  return {
    currentProvider: {
      host
    },
    eth: {
      Contract: () => {}
    }
  }
}

describe('Testing ContractClient class with ProviderSelection', () => {
  beforeEach(async () => {
    // Setting up ContractClient stub
    const getRegistryAddressFn = () => { return '0xaaaaaaaaaaaaaaaaaaa' }
    const web3Manager = new Web3Manager()
    const web3obj = createWeb3Obj('https://audius.poa.network')
    web3Manager.web3 = web3obj
    web3Manager.web3Config = {}
    web3Manager.web3Config.useExternalWeb3 = false
    web3Manager.web3Config.internalWeb3Config = {}
    const gateways = ['https://audius.poa.network', 'https://public.poa.network']
    web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints = gateways
    sinon.stub(web3Manager, 'provider').callsFake((arg1, arg2) => { return arg1 })
    contractClient = new ContractClient(web3Manager, 'contractABI', 'contractRegistryKey', getRegistryAddressFn)
  })

  afterEach(async () => {
    // Reset stub
    sinon.restore()
  })

  /**
     * Given: audius gateway is healthy
     * When: we do contract logic
     * Should: do not use provider selection logic and use initially set audius gateway
     */
  it('should use initial audius gateway if healthy', async () => {
    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { return arg1 })
    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://audius.poa.network')
    assert(initWithProviderSelectionSpy.calledOnce)
    assert(consoleSpy.notCalled)
  })

  /**
     * Given: both gatetways are unhealthy
     * When: we do contract logic
     * Should: try both gateways and then log error
     */
  // note: when web3 is set to a new object, the second call will throw a different error. that is acceptable
  // as we don't care about what the error is
  it('should log error if both audius gateway and public gateway are unhealthy', async () => {
    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { throw new Error('Bad provider') })
    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert(initWithProviderSelectionSpy.calledTwice)
    assert(consoleSpy.calledOnce)
  })

  // TODO: can't mock new Web3() call and will err unless stub is injected into tested module
  /**
     * Given: audius gateway is not healthy but the public gateway is
     * When: we do contract logic
     * Should: fail with audius gateway, recursively select the public gateway, then pass when
     * using the public gateway
     */
  // it.skip('should use public gateway when initial audius gateway is unhealthy', async () => {
  //   sinon.stub(contractClient.web3Manager.web3.eth, 'Contract')
  //     .onFirstCall()
  //     .throws(new Error('Bad provider'))
  //     .onSecondCall()
  //     .callsFake((arg1, arg2) => { return arg1 })
  //   const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
  //   const consoleSpy = sinon.spy(console, 'error')

  //   await contractClient.init()

  //   assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://public.poa.network')
  //   assert(initWithProviderSelectionSpy.calledTwice)
  //   assert(consoleSpy.notCalled)
  // })

  /**
     * Given: contractClient.web3Manager is instanceof ethWeb3Manager
     * When: contract logic passes
     * Should: pass on first try and use initially set gateway
     */
  it('should use initial gateway url if web3Manager is instanceof ethWeb3Manager and contract logic passes', async () => {
    // Initializing ethWeb3Manager with dummy data
    const web3Config = { url: 'https://audius.eth.network', ownerWallet: '0xvicky' }
    const ethWeb3Manager = new EthWeb3Manager(web3Config)
    // ethWeb3Manager.web3 = { currentProvider: { host: 'https://eth.network' } }
    ethWeb3Manager.web3 = createWeb3Obj('https://eth.network')
    contractClient.web3Manager = ethWeb3Manager

    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { return arg1 })

    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://eth.network')
    assert(initWithProviderSelectionSpy.calledOnce)
    assert(consoleSpy.notCalled)
  })

  /**
     * Given: contractClient.web3Manager is instanceof ethWeb3Manager
     * When: contract logic fails
     * Should: do not do retry logic and log error
     */
  it('should log error if web3Manager is instanceof ethWeb3Manager and contract logic fails', async () => {
    // Initializing ethWeb3Manager with dummy data
    const web3Config = { url: 'https://audius.eth.network', ownerWallet: '0xvicky' }
    const ethWeb3Manager = new EthWeb3Manager(web3Config)
    ethWeb3Manager.web3 = createWeb3Obj('https://eth.network')
    contractClient.web3Manager = ethWeb3Manager

    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { throw new Error('Bad provider') })

    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://eth.network')
    assert(initWithProviderSelectionSpy.calledOnce)
    assert(consoleSpy.calledOnce)
  })

  /**
     * Given: we are using an external web3
     * When: contract logic passes
     * Should: pass on first try and use initially set gateway
     */
  it('should use initial gateway url if useExternalWeb3 is true and contract logic passes', async () => {
    contractClient.web3Manager.web3Config.useExternalWeb3 = true

    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { return arg1 })

    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://audius.poa.network')
    assert(initWithProviderSelectionSpy.calledOnce)
    assert(consoleSpy.notCalled)
  })

  /**
     * Given: we are using an external web3
     * When: contract logic fails
     * Should: do not do retry logic and log error
     */
  it('should log error if useExternalWeb3 is true and contract logic fails', async () => {
    contractClient.web3Manager.web3Config.useExternalWeb3 = true

    sinon.stub(contractClient.web3Manager.web3.eth, 'Contract').callsFake((arg1, arg2) => { throw new Error('Bad provider') })

    const initWithProviderSelectionSpy = sinon.spy(contractClient, 'initWithProviderSelection')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert(initWithProviderSelectionSpy.calledOnce)
    assert(consoleSpy.calledOnce)
  })
})
