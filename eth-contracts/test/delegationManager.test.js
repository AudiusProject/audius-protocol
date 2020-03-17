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

const toWei = (aud) => {
  let amountInAudWei = web3.utils.toWei(
    aud.toString(),
    'ether'
  )

  let amountInAudWeiBN = web3.utils.toBN(amountInAudWei)
  return amountInAudWeiBN
}

const fromWei = (wei) => {
  return web3.utils.fromWei(wei)
}

const getTokenBalance2 = async (token, account) => fromWei(await token.balanceOf(account))

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
const testCreatorNodeType = web3.utils.utf8ToHex('creator-node')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

const MIN_STAKE_AMOUNT = 10

// 1000 AUD converted to AUDWei, multiplying by 10^18
const INITIAL_BAL = toWei(1000)
const DEFAULT_AMOUNT = toWei(100)
const MAX_STAKE_AMOUNT = DEFAULT_AMOUNT * 100

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

  beforeEach(async () => {
    registry = await Registry.new()

    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })

    // Deploy registry
    await registry.addContract(ownedUpgradeabilityProxyKey, proxy.address)

    token = await AudiusToken.new({ from: treasuryAddress })
    tokenAddress = token.address
    // console.log(`AudiusToken Address : ${tokenAddress}`)
    let initialTokenBal = fromBn(await token.balanceOf(accounts[0]))
    // console.log(`AudiusToken Balance: ${initialTokenBal}`)
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
    // Approve staking transfer
    await token.approve(stakingAddress, amount, { from: account })

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

  const getStakeAmountForAccount = async (account) => {
    return fromBn(await staking.totalStakedFor(account))
  }

  const getServiceProviderIdsFromAddress = async (account, type) => {
    // Query and convert returned IDs to bignumber
    let ids = (
      await serviceProviderFactory.getServiceProviderIdsFromAddress(account, type)
    ).map(x => fromBn(x))
    return ids
  }

  const serviceProviderIDRegisteredToAccount = async (account, type, id) => {
    let ids = await getServiceProviderIdsFromAddress(account, type)
    let newIdFound = ids.includes(id)
    return newIdFound
  }

  describe('Registration flow', () => {
    let regTx
    const stakerAccount = accounts[1]

    beforeEach(async () => {
      let initialBal = await token.balanceOf(stakerAccount)

      // 1st endpoint for stakerAccount = https://localhost:5000
      // Total Stake = 120 AUD
      regTx = await registerServiceProvider(
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      // Confirm event has correct amount
      assert.equal(regTx.stakedAmountInt, DEFAULT_AMOUNT)

      // Confirm balance updated for tokens
      let finalBal = await token.balanceOf(stakerAccount)
      assert.isTrue(initialBal.eq(finalBal.add(DEFAULT_AMOUNT)), 'Expect funds to be transferred')

      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        regTx.spID)
      assert.isTrue(
        newIdFound,
        'Expected to find newly registered ID associated with this account')

      let stakedAmount = await getStakeAmountForAccount(stakerAccount)
      assert.equal(
        stakedAmount,
        DEFAULT_AMOUNT,
        'Expect default stake amount')

      let spTypeInfo = await serviceProviderFactory.getServiceStakeInfo(testDiscProvType)
      let typeMin = fromWei(spTypeInfo[0])
      let typeMax = fromWei(spTypeInfo[1])

      // Validate min stake requirements
      // Both current account bounds and single testDiscProvType bounds expected to be equal 
      let bounds = await serviceProviderFactory.getAccountStakeBounds(stakerAccount)
      let accountMin = fromWei(bounds[0])
      let accountMax = fromWei(bounds[1])
      assert.equal(
        typeMin,
        accountMin,
        'Expect account min to equal sp type 1 min')
      assert.equal(
        typeMax,
        accountMax,
        'Expect account max to equal sp type 1 max')
    })

    /*
     * For fixing this
     */
    it('sandbox', async () => {
      // Confirm staking contract has correct amt
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      // let delegator = accounts[2]
      // Transfer 1000 tokens to delegator
      // await token.transfer(delegator, INITIAL_BAL, { from: treasuryAddress })
      let multiplier = await staking.getCurrentStakeMultiplier()
      console.log(fromBn(multiplier))
    })
  })
})
