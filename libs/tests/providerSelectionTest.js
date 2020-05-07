const assert = require('assert')
const sinon = require('sinon')

const ContractClient = require('../src/services/contracts/ContractClient')
const ProviderSelection = require('../src/services/contracts/ProviderSelection')
const Web3Manager = require('../src/services/web3Manager/index')
const EthWeb3Manager = require('../src/services/ethWeb3Manager/index')

let contractClient
let providerSelector

/**
 * TODO:
 *  - need to mock Web3() lib to work/fail as expected; nock prob wont help?
*/
describe('Testing ContractClient class', () => {
  beforeEach(async () => {
    // Setting up ContractClinet stub
    const getRegistryAddressFn = () => { return '0xaaaaaaaaaaaaaaaaaaa' }
    const web3Manager = new Web3Manager()
    web3Manager.web3 = { currentProvider: { host: 'https://audius.poa.network' } }
    sinon.stub(web3Manager, 'provider').callsFake(provider => { return provider })
    contractClient = new ContractClient(web3Manager, 'contractABI', 'contractRegistryKey', getRegistryAddressFn)
    // contractClient.createWeb3EthContractInstance = () => {}

    const gateways = ['https://audius.poa.network', 'https://public.poa.network']
    providerSelector = new ProviderSelection(gateways)
  })

  afterEach(async () => {
    sinon.restore()
  })

  /**
     * Given: audius gateway is healthy
     * When: we do contract logic
     * Should: pass on first try and use initially set audius gateway
     */
  it('should use initial audius gateway if healthy', async () => {
    sinon.stub(contractClient, 'createWeb3EthContractInstance').callsFake(() => { return 'testContract' })

    // TODO: test that select is only called once
    // const selectSpy = sinon.spy(providerSelector, 'select')
    await providerSelector.setContractClientProvider(contractClient)

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://audius.poa.network')
  })

  /**
     * Given: both gatetways are unhealthy
     * When: we do contract logic
     * Should: log error
     */
  it('should log error if both audius gateway and public gateway are unhealthy', async () => {
    sinon.stub(contractClient, 'createWeb3EthContractInstance').callsFake(() => { throw new Error('Bad provider') })
    const consoleSpy = sinon.spy(console, 'error')
    await providerSelector.setContractClientProvider(contractClient)

    assert(consoleSpy.calledOnce)
  })

  /**
     * Given: audius gateway is not healthy but the public gateway is
     * When: we do contract logic
     * Should: pass on fail on first try, then pass on second try using public gateway
     */
  it('should use public gateway when initial audius gateway is unhealthy', async () => {
    sinon.stub(contractClient, 'createWeb3EthContractInstance')
      .onFirstCall()
      .throws(new Error('Bad provider'))
      .onSecondCall()
      .returns('testContract')
    await providerSelector.setContractClientProvider(contractClient)

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://public.poa.network')
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

    sinon.stub(contractClient, 'createWeb3EthContractInstance').callsFake(() => { })

    await providerSelector.setContractClientProvider(contractClient)

    assert.strictEqual(contractClient.web3Manager.getWeb3().currentProvider.host, 'https://eth.network')
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
    ethWeb3Manager.web3 = { currentProvider: { host: 'https://audius.eth.network' } }
    contractClient.web3Manager = ethWeb3Manager

    sinon.stub(contractClient, 'createWeb3EthContractInstance').callsFake(() => { throw new Error('Bad provider') })

    // Spy on methods
    const selectSpy = sinon.spy(providerSelector, 'select')
    const consoleSpy = sinon.spy(console, 'error')
    await providerSelector.setContractClientProvider(contractClient)

    assert(selectSpy.notCalled)
    assert(consoleSpy.calledOnce)
  })
})
