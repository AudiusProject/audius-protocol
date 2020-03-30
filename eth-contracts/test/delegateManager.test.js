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
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')

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
  const stakerAccount2 = accounts[3]

  let slasherAccount = stakerAccount

  beforeEach(async () => {
    console.log('here')
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
      registry.address,
      ownedUpgradeabilityProxyKey,
      { from: accounts[0] })

    await registry.addContract(claimFactoryKey, claimFactory.address)

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: accounts[0] })

    delegateManager = await DelegateManager.new(
      token.address,
      registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderFactoryKey,
      claimFactoryKey)
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

  const ensureValidClaimPeriod = async () => {
    let currentBlock = await web3.eth.getBlock('latest')
    let currentBlockNum = currentBlock.number
    let lastFundBlock = await claimFactory.getLastFundBlock()
    let claimDiff = await claimFactory.getClaimBlockDifference()
    let nextClaimBlock = lastFundBlock.add(claimDiff)
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await web3.eth.getBlock('latest')
      currentBlockNum = currentBlock.number
    }
  }


  const printAccountStakeInfo = async (account) => {
    console.log('')
    let spFactoryStake
    let totalInStakingContract
    spFactoryStake = await serviceProviderFactory.getServiceProviderStake(account)
    totalInStakingContract = await staking.totalStakedFor(account)

    let delegatedStake = web3.utils.toBN(0)
    let delegators = await delegateManager.getDelegatorsList(account)
    for (var i = 0; i < delegators.length; i++) {
      let amountDelegated = await delegateManager.getTotalDelegatorStake(delegators[i])
      delegatedStake = delegatedStake.add(amountDelegated)
    }
    let outsideStake = spFactoryStake.add(delegatedStake)
    // let tokensInStaking = await token.balanceOf(account)
    // console.log(`${account} Total balance in stakingContract ${tokensInStaking}`)
    console.log(`${account} SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}, Outside Stake: ${outsideStake} Staking: ${totalInStakingContract}`)
    let stakeDiscrepancy = totalInStakingContract.sub(outsideStake)
    console.log(`Internal (Staking) vs External (DelegateManager + SPFactory) Stake discrepancy: ${stakeDiscrepancy}`)
  }

  // Funds a claim, claims value for single SP address + delegators, slashes 
  // Slashes claim amount
  const fundClaimSlash = async (slash) => {
    console.log('----')
    // Ensure block difference is met prior to any operations
    await ensureValidClaimPeriod()

    // Continue
    await printAccountStakeInfo(stakerAccount)
    await printAccountStakeInfo(stakerAccount2)
    let totalStaked = await staking.totalStaked()
    console.log(`Total tracked stake in Staking.sol: ${totalStaked}`)

    // Update SP Deployer Cut to 10%
    await serviceProviderFactory.updateServiceProviderCut(stakerAccount, 10, { from: stakerAccount })
    // Fund new claim
    await claimFactory.initiateRound()

    // Transfer tokens to Staking
    // await claimFactory.processClaim(stakerAccount)
    await delegateManager.claimRewards({ from: stakerAccount })
    await delegateManager.claimRewards({ from: stakerAccount2 })

    await printAccountStakeInfo(stakerAccount)
    await printAccountStakeInfo(stakerAccount2)

    console.log('')
    if (slash) {
      let slashNumerator = web3.utils.toBN(30)
      let slashDenominator = web3.utils.toBN(100)
      let totalInStakingContract = await staking.totalStakedFor(slasherAccount)
      let slashAmount = (totalInStakingContract.mul(slashNumerator)).div(slashDenominator)
      console.log(`Slashing ${slasherAccount} amount: ${slashAmount}`)
      // Perform slash functions
      await delegateManager.slash(slashAmount, slasherAccount)

      // Switch slasher
      if (slasherAccount === stakerAccount) {
        slasherAccount = stakerAccount2
      } else {
        slasherAccount = stakerAccount
      }
      console.log(`Next slash to ${slasherAccount}`)
    }
    console.log('')

    await printAccountStakeInfo(stakerAccount)
    await printAccountStakeInfo(stakerAccount2)

    let tokensInStaking = await token.balanceOf(stakingAddress)
    totalStaked = await staking.totalStaked()
    console.log(`Total tracked stake in Staking.sol: ${totalStaked}`)
    console.log(`Total tokens for stakingAddress ${tokensInStaking}`)

    let tokensAvailableVsTotalStaked = tokensInStaking.sub(totalStaked)
    console.log(`Tokens available to staking address - total tracked in staking contract = ${tokensAvailableVsTotalStaked}`)
    console.log('----')
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

  describe('Delegation flow', () => {
    let regTx
    beforeEach(async () => {
      // Transfer 1000 tokens to staker
      await token.transfer(stakerAccount, INITIAL_BAL, { from: treasuryAddress })
      await token.transfer(stakerAccount2, INITIAL_BAL, { from: treasuryAddress })

      let initialBal = await token.balanceOf(stakerAccount)

      // 1st endpoint for stakerAccount = https://localhost:5000
      // Total Stake = 120 AUD
      regTx = await registerServiceProvider(
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      await registerServiceProvider(
        testDiscProvType,
        testEndpoint1,
        DEFAULT_AMOUNT,
        stakerAccount2)

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

      await claimFactory.initiateRound()

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

    it.only('single delegator + claim + slash', async () => {
      // TODO: Run claim / clash pattern 10,000x and confirm discrepancy
      // Validate discrepancy against some pre-known value, 1AUD or <1AUD
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

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

      await fundClaimSlash(false)
      /*
      let total = 1000
      let iterations = total
      while (iterations > 0) {
        let slash = false
        if (((total - iterations) + 1) % 10 === 0) {
          slash = true
        }
        console.log(`Round ${(total - iterations) + 1}`)
        await fundClaimSlash(slash)
        iterations--
      }
      */

      // Summarize after execution
      let spFactoryStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalInStakingContract = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let outsideStake = spFactoryStake.add(delegatedStake)
      console.log(`SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}, Outside stake: ${outsideStake},  Staking: ${totalInStakingContract}`)
      let stakeDiscrepancy = totalInStakingContract.sub(outsideStake)
      console.log(`Stake discrepancy: ${stakeDiscrepancy}`)
      let oneAud = toWei(1)
      console.log(`1 AUD: ${oneAud}`)

      let tokensInStaking = await token.balanceOf(stakingAddress)
      console.log(`Tokens in staking ${tokensInStaking}`)
    })

    // TODO: What happens when someone delegates after a funding round has started...?
    // Do they still get rewards or not?

    // 2 service providers, 1 claim, no delegation
    // 2 service providers, 1 claim, delegation to first SP
  })
})
