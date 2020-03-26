import * as _lib from './_lib/lib.js'

const encodeCall = require('./encodeCall')
const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const Staking = artifacts.require('Staking')

const DelegateManager = artifacts.require('DelegateManager')

const ClaimFactory = artifacts.require('ClaimFactory')

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
const DEFAULT_AMOUNT = toWei(120)
const MAX_STAKE_AMOUNT = DEFAULT_AMOUNT * 100

contract('DelegateManager', async (accounts) => {
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

  let claimFactory
  let delegateManager

  const stakerAccount = accounts[1]
  const delegatorAccount1 = accounts[2]

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

    // Create new claim factory instance
    claimFactory = await ClaimFactory.new(
      token.address,
      proxy.address,
      { from: accounts[0] })

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: accounts[0] })

    delegateManager = await DelegateManager.new(
      token.address,
      registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderFactoryKey)
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

  const increaseRegisteredProviderStake = async (type, endpoint, increase, account) => {
    // Approve token transfer
    await token.approve(
      stakingAddress,
      increase,
      { from: account })

    let tx = await serviceProviderFactory.increaseStake(
      increase,
      { from: account })

    let args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    // console.dir(args, { depth: 5 })
  }

  const getStakeAmountForAccount = async (account) => {
    return fromBn(await staking.totalStakedFor(account))
  }

  const decreaseRegisteredProviderStake = async (decrease, account) => {
    // Approve token transfer from staking contract to account
    let tx = await serviceProviderFactory.decreaseStake(
      decrease,
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

  describe('Delegation flow', () => {
    let regTx
    beforeEach(async () => {
      // Transfer 1000 tokens to staker
      await token.transfer(stakerAccount, INITIAL_BAL, { from: treasuryAddress })

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
    })

    it('initial state + claim', async () => {
      // Validate basic claim w/SP path
      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalStakedForAccount = await staking.totalStakedFor(stakerAccount)

      await claimFactory.initiateClaim()

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)

      await delegateManager.makeClaim({ from: stakerAccount })
      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      assert.isTrue(
        spStake.eq(totalStakedForAccount),
        'Stake value in SPFactory and Staking.sol must be equal')
    })

    it('single delegator basic operations', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

      let totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let initialSpStake = totalStakedForSP
      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      let delegators = await delegateManager.getDelegatorsList(stakerAccount)
      await delegateManager.increaseDelegatedStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegators = await delegateManager.getDelegatorsList(stakerAccount)

      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let delegatedStakeForSP = await delegateManager.getDelegatorStakeForServiceProvider(
        delegatorAccount1,
        stakerAccount)
      let delegatorFound = delegators.includes(delegatorAccount1)

      assert.isTrue(
        delegatorFound,
        'Delegator found in array'
      )
      assert.isTrue(
        delegatedStake.eq(delegatedStakeForSP),
        'All stake expected for Service Provider'
      )
      assert.isTrue(
        totalStakedForSP.eq(spStake.add(delegatedStake)),
        'Sum of Staking.sol equals SPFactory and DelegateManager'
      )
      await delegateManager.decreaseDelegatedStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegators = await delegateManager.getDelegatorsList(stakerAccount)
      assert.equal(
        delegators.length,
        0,
        'Expect no remaining delegators')
      assert.isTrue(
        initialSpStake.eq(totalStakedForSP),
        'Staking.sol back to initial value')
    })

    it('single delegator + claim', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

      let totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.increaseDelegatedStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)

      // Update SP Deployer Cut to 10%
      await serviceProviderFactory.updateServiceProviderCut(stakerAccount, 10, { from: stakerAccount })
      let deployerCut = await serviceProviderFactory.getServiceProviderDeployerCut(stakerAccount)
      let deployerCutBase = await serviceProviderFactory.getServiceProviderDeployerCutBase()
      await claimFactory.initiateClaim()

      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let totalValueOutsideStaking = spStake.add(delegatedStake)
      let totalRewards = totalStakedForSP.sub(totalValueOutsideStaking)

      // Manually calculate expected value prior to making claim
      // Identical math as contract
      let delegateRewardsPriorToSPCut = (delegatedStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let spDeployerCut = (delegateRewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase)
      let delegateRewards = delegateRewardsPriorToSPCut.sub(spDeployerCut)
      let expectedDelegateStake = delegatedStake.add(delegateRewards)

      let spRewardShare = (spStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let expectedSpStake = spStake.add(spRewardShare.add(spDeployerCut))

      await delegateManager.makeClaim({ from: stakerAccount })
      let finalSpStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let finalDelegateStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)

      assert.isTrue(finalSpStake.eq(expectedSpStake), 'Expected SP stake matches found value')
      assert.isTrue(finalDelegateStake.eq(expectedDelegateStake), 'Expected delegate stake matches found value')
    })

    it('single delegator + claim + slash', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

      let delegatedStake
      let spFactoryStake
      let totalInStakingContract

      totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.increaseDelegatedStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)

      spFactoryStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      console.log(`SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}, Staking: ${totalInStakingContract}`)

      // Update SP Deployer Cut to 10%
      await serviceProviderFactory.updateServiceProviderCut(stakerAccount, 10, { from: stakerAccount })
      // Fund new claim
      await claimFactory.initiateClaim()

      // Perform claim
      await delegateManager.makeClaim({ from: stakerAccount })

      // let finalSpStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      // let finalDelegateStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)

      spFactoryStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let outsideStake = spFactoryStake.add(delegatedStake)
      let slashAmount = toWei(100)

      let currentMultiplier = await staking.getCurrentStakeMultiplier()
      console.log(`Slash amount: ${slashAmount}, stake multiplier: ${currentMultiplier}`)
      console.log(`SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}, Outside stake: ${outsideStake},  Staking: ${totalInStakingContract}`)

      console.log('Slashing...')
      // Perform slash functions
      await delegateManager.slash(slashAmount, stakerAccount);

      spFactoryStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      outsideStake = spFactoryStake.add(delegatedStake)
      console.log(`SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}, Outside stake: ${outsideStake},  Staking: ${totalInStakingContract}`)
      let stakeDiscrepancy = totalInStakingContract.sub(outsideStake)
      console.log(`Stake discrepancy: ${stakeDiscrepancy}`)
      // assert.isTrue(finalSpStake.eq(expectedSpStake), 'Expected SP stake matches found value')
      // assert.isTrue(finalDelegateStake.eq(expectedDelegateStake), 'Expected delegate stake matches found value')
    })

    // 2 service providers, 1 claim, no delegation
    // 2 service providers, 1 claim, delegation to first SP
  })
})
