const assert = require('assert')
const sinon = require('sinon')

const ContractClient = require('../src/services/contracts/ContractClient')
const Web3Manager = require('../src/services/web3Manager/index')
const EthWeb3Manager = require('../src/services/ethWeb3Manager/index')

let contractClient

describe('Testing ContractClient class', () => {
  beforeEach(async () => {
    // Setting up ContractClient stub
    const getRegistryAddressFn = () => { return '0xaaaaaaaaaaaaaaaaaaa' }
    const web3Manager = new Web3Manager()
    const gateways = ['https://audius.poa.network', 'https://public.poa.network']
    web3Manager.getWeb3Providers = () => { return gateways }
    web3Manager.web3 = { currentProvider: { host: 'https://audius.poa.network' }, eth: { Contract: () => { } } }
    sinon.stub(web3Manager, 'provider').callsFake(provider => { return provider })
    contractClient = new ContractClient(web3Manager, 'contractABI', 'contractRegistryKey', getRegistryAddressFn)
  })

  afterEach(async () => {
    sinon.restore()
  })

  /**
     * Given: audius gateway is healthy
     * When: we do contract logic
     * Should: do not use provider selection logic and use initially set audius gateway
     */
  it('should use initial audius gateway if healthy', async () => {
    sinon.stub(contractClient.web3.eth, 'Contract').callsFake((arg1, arg2) => { return arg1 })
    const initializeContractsSpy = sinon.spy(contractClient, 'initializeContracts')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://audius.poa.network')
    assert(initializeContractsSpy.calledOnce)
    assert(consoleSpy.notCalled)
  })

  /**
     * Given: both gatetways are unhealthy
     * When: we do contract logic
     * Should: log error
     */
  it('should log error if both audius gateway and public gateway are unhealthy', async () => {
    sinon.stub(contractClient.web3.eth, 'Contract').callsFake((arg1, arg2) => { throw new Error('Bad provider') })
    const initializeContractsSpy = sinon.spy(contractClient, 'initializeContracts')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert(initializeContractsSpy.calledTwice)
    assert(consoleSpy.calledOnce)
  })

  /**
     * Given: audius gateway is not healthy but the public gateway is
     * When: we do contract logic
     * Should: pass on fail on first try, then pass on second try using public gateway
     */
  it('should use public gateway when initial audius gateway is unhealthy', async () => {
    sinon.stub(contractClient.web3.eth, 'Contract')
      .onFirstCall()
      .throws(new Error('Bad provider'))
      .onSecondCall()
      .callsFake((arg1, arg2) => { return arg1 })
    const initializeContractsSpy = sinon.spy(contractClient, 'initializeContracts')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://public.poa.network')
    assert(initializeContractsSpy.calledTwice)
    assert(consoleSpy.notCalled)
  })

  /**
     * Given: contractClient.web3Manager is instanceof ethWeb3Manager
     * When: contract logic passes
     * Should: pass on first try and use initially set gateway
     */
  it('should use initial gateway url if web3Manager is instanceof ethWeb3Manager and contract logic passes', async () => {
    // Initializing ethWeb3Manager with dummy data
    const web3Config = { url: 'https://audius.eth.network', ownerWallet: '0xvicky' }
    const ethWeb3Manager = new EthWeb3Manager(web3Config)
    ethWeb3Manager.web3 = { currentProvider: { host: 'https://eth.network' } }
    contractClient.web3Manager = ethWeb3Manager

    sinon.stub(contractClient.web3.eth, 'Contract').callsFake((arg1, arg2) => { return arg1 })

    const initializeContractsSpy = sinon.spy(contractClient, 'initializeContracts')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://eth.network')
    assert(initializeContractsSpy.calledOnce)
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
    ethWeb3Manager.web3 = { currentProvider: { host: 'https://eth.network' } }
    contractClient.web3Manager = ethWeb3Manager

    sinon.stub(contractClient.web3.eth, 'Contract').callsFake((arg1, arg2) => { throw new Error('Bad provider') })

    const initializeContractsSpy = sinon.spy(contractClient, 'initializeContracts')
    const consoleSpy = sinon.spy(console, 'error')

    await contractClient.init()

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://eth.network')
    assert(initializeContractsSpy.calledOnce)
    assert(consoleSpy.calledOnce)
  })
})
