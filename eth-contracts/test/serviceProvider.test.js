import * as _lib from './_lib/lib.js'

const encodeCall = require('./encodeCall')
const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const Staking = artifacts.require('Staking')

const fromBn = n => parseInt(n.valueOf(), 10)

const getTokenBalance = async (token, account) => fromBn(await token.balanceOf(account))
const claimBlockDiff = 46000

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

const testServiceType = web3.utils.utf8ToHex('test-service')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

contract('ServiceProvider test', async (accounts) => {
  let treasuryAddress = accounts[0]
  let proxyOwner = treasuryAddress
  let proxy
  let impl0
  let staking
  let token
  let registry
  let stakingAddress
  let tokenAddress
  let serviceProviderStorage
  let serviceProviderFactory

  const DEFAULT_AMOUNT = 120
  const INITIAL_BAL = 1000

  beforeEach(async () => {
    registry = await Registry.new()

    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })

    // Deploy registry
    await registry.addContract(ownedUpgradeabilityProxyKey, proxy.address)

    token = await AudiusToken.new({ from: treasuryAddress })
    tokenAddress = token.address
    impl0 = await Staking.new()

    // Create initialization data
    let initializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, treasuryAddress])

    // Initialize staking contract
    await proxy.upgradeToAndCall(
      impl0.address,
      initializeData,
      { from: proxyOwner })

    staking = await Staking.at(proxy.address)
    stakingAddress = staking.address

    // Reset min for test purposes
    await staking.setMinStakeAmount(0)

    // Deploy sp storage
    serviceProviderStorage = await ServiceProviderStorage.new(registry.address)
    await registry.addContract(serviceProviderStorageKey, serviceProviderStorage.address)

    // Deploy sp factory
    serviceProviderFactory = await ServiceProviderFactory.new(
      registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderStorageKey)

    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address)

    // Permission sp factory as caller, from the proxy owner address 
    // (which happens to equal treasury in this test case)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address, { from: proxyOwner })

    // Transfer 1000 tokens to accounts[1]
    await token.transfer(accounts[1], INITIAL_BAL, { from: treasuryAddress })
  })

  /* Helper functions */

  const registerServiceProvider = async (type, endpoint, amount, account) => {
    let tx = await serviceProviderFactory.register(
      type,
      endpoint,
      amount,
      account,
      { from: account })

    let args = tx.logs.find(log => log.event === 'RegisteredServiceProvider').args
    args.stakedAmountInt = fromBn(args._stakeAmount)
    args.spID = fromBn(args._spID)
    return args
  }

  const increaseRegisteredProviderStake = async (type, endpoint, increase, account) => {
    // Approve token transfer
    await token.approve(
      stakingAddress,
      DEFAULT_AMOUNT,
      { from: account })

    let tx = await serviceProviderFactory.increaseServiceStake(
      type,
      endpoint,
      increase,
      { from: account })

    let args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    // console.dir(args, { depth: 5 })
  }

  const decreaseRegisteredProviderStake = async (type, endpoint, increase, account) => {
    // Approve token transfer from staking contract to account
    let tx = await serviceProviderFactory.decreaseServiceStake(
      type,
      endpoint,
      increase,
      { from: account })

    let args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    // console.dir(args, { depth: 5 })
  }

  const deregisterServiceProvider = async (type, endpoint, account) => {
    let deregTx = await serviceProviderFactory.deregister(
      type,
      endpoint,
      { from: account })
    let args = deregTx.logs.find(log => log.event === 'DeregisteredServiceProvider').args
    args.unstakedAmountInt = fromBn(args._unstakeAmount)
    args.spID = fromBn(args._spID)
    return args
  }

  describe('Registration flow', () => {
    let regTx
    const stakerAccount = accounts[1]
    beforeEach(async () => {
      // Approve staking transfer
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: stakerAccount })
      let initialBal = await getTokenBalance(token, stakerAccount)

      regTx = await registerServiceProvider(
        testServiceType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      // Confirm event has correct amount
      assert.equal(regTx.stakedAmountInt, DEFAULT_AMOUNT)

      // Confirm balance updated for tokens
      let finalBal = await getTokenBalance(token, stakerAccount)
      assert.equal(initialBal, finalBal + DEFAULT_AMOUNT, 'Expect funds to be transferred')
    })

    it('confirm registered stake', async () => {
      // Confirm staking contract has correct amt
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT)
    })

    it('fails to register multiple endpoints w/same account', async () => {
      // Approve staking transfer
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: stakerAccount })
      let initialBal = await getTokenBalance(token, stakerAccount)

      // Attempt to register a new endpoint with the same account
      await _lib.assertRevert(
        registerServiceProvider(
          testServiceType,
          testEndpoint1,
          DEFAULT_AMOUNT,
          stakerAccount),
      'Account already has an endpoint registered')
    })

    it('increases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT)

      await increaseRegisteredProviderStake(
        testServiceType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testServiceType,
        regTx.spID)

      // Confirm increased amount in staking contract
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT * 2)
    })

    it('decreases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT)

      let initialBal = await getTokenBalance(token, stakerAccount)
      let decreaseStakeAmount = DEFAULT_AMOUNT / 2

      await decreaseRegisteredProviderStake(
        testServiceType,
        testEndpoint,
        decreaseStakeAmount,
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testServiceType,
        regTx.spID)

      // Confirm decreased amount in staking contract
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT / 2)

      // Confir balance
      assert.equal(
        await getTokenBalance(token, stakerAccount),
        initialBal + (DEFAULT_AMOUNT / 2),
        'Expect increase in token balance after decreasing stake')
    })

    it('fails to decrease more than staked', async () => {
      // Confirm initial amount in staking contract
      assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT)
      let decreaseStakeAmount = DEFAULT_AMOUNT + 2
      // Confirm revert
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          testServiceType,
          testEndpoint,
          decreaseStakeAmount,
          stakerAccount))
    })
  })

  // TODO: Address how approval works..? do we need to approve? doesnt seem like it exactly
  it('deregisters and unstakes', async () => {
    const stakerAccount = accounts[1]

    // Approve staking transfer
    await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: stakerAccount })

    let regTx = await registerServiceProvider(
      testServiceType,
      testEndpoint,
      DEFAULT_AMOUNT,
      stakerAccount)
    // Confirm event has correct amount
    assert.equal(regTx.stakedAmountInt, DEFAULT_AMOUNT)

    // Test 2
    assert.equal(
      await getTokenBalance(token, stakerAccount),
      INITIAL_BAL - DEFAULT_AMOUNT,
      'Expect decreased token balance after staking')

    // Confirm staking contract has correct amt
    assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), DEFAULT_AMOUNT)

    // deregister service provider
    let deregTx = await deregisterServiceProvider(testServiceType, testEndpoint, stakerAccount)

    assert.equal(
      deregTx.spID,
      regTx.spID)

    assert.equal(
      deregTx.unstakedAmountInt,
      DEFAULT_AMOUNT)

    // Confirm no stake is remaining in staking contract
    assert.equal(fromBn(await staking.totalStakedFor(stakerAccount)), 0)

    // Test 3
    assert.equal(
      await getTokenBalance(token, stakerAccount),
      INITIAL_BAL,
      'Expect full amount returned to staker after deregistering')
  })
})
