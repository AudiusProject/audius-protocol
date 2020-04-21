import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const Staking = artifacts.require('Staking')
const DelegateManager = artifacts.require('DelegateManager')
const ClaimFactory = artifacts.require('ClaimFactory')
const MockGovernance = artifacts.require('MockGovernance')

const fromBn = n => parseInt(n.valueOf(), 10)
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

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'
const testEndpoint3 = 'https://localhost:5002'

// 1000 AUD converted to AUDWei, multiplying by 10^18
const INITIAL_BAL = toWei(1000)
const DEFAULT_AMOUNT = toWei(120)

contract('DelegateManager', async (accounts) => {
<<<<<<< HEAD
  let treasuryAddress = accounts[0]
  let proxyOwner = treasuryAddress
  let proxy
  let impl0
  let staking
  let token
  let registry
  let stakingAddress
  let serviceProviderStorage
  let serviceProviderFactory

  let claimFactory
  let delegateManager
  let mockGovernance

  const stakerAccount = accounts[1]
  const delegatorAccount1 = accounts[2]
  const stakerAccount2 = accounts[3]

  let slasherAccount = stakerAccount
=======
  let proxy, staking0, staking, stakingAddress, token, registry, serviceProviderStorage, serviceProviderFactory, claimFactory, delegateManager
  
  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts
  const stakerAccount = accounts[10]
  const delegatorAccount1 = accounts[11]
  const stakerAccount2 = accounts[12]
  const slasherAccount = stakerAccount
>>>>>>> mainnet

  beforeEach(async () => {
    token = await AudiusToken.new({ from: treasuryAddress })
    registry = await Registry.new({ from: treasuryAddress })

    // Set up staking
    staking0 = await Staking.new({ from: proxyAdminAddress })
    const stakingInitializeData = encodeCall(
      'initialize',
<<<<<<< HEAD
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        treasuryAddress,
        registry.address,
        claimFactoryKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )

    // Initialize staking contract
    await proxy.upgradeToAndCall(
      impl0.address,
      initializeData,
      { from: proxyOwner })

=======
      ['address', 'address'],
      [token.address, treasuryAddress]
    )
    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
>>>>>>> mainnet
    staking = await Staking.at(proxy.address)
    await registry.addContract(stakingProxyKey, proxy.address, { from: treasuryAddress })
    stakingAddress = staking.address
    
    // Deploy sp storage
    serviceProviderStorage = await ServiceProviderStorage.new(registry.address)
    await registry.addContract(serviceProviderStorageKey, serviceProviderStorage.address)

    // Deploy sp factory
    serviceProviderFactory = await ServiceProviderFactory.new(
      registry.address,
<<<<<<< HEAD
      ownedUpgradeabilityProxyKey,
      delegateManagerKey,
=======
      stakingProxyKey,
>>>>>>> mainnet
      serviceProviderStorageKey)

    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address)

<<<<<<< HEAD
=======
    // Permission sp factory as caller, from the proxy owner address
    // (which happens to equal treasury in this test case)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address, { from: treasuryAddress })

>>>>>>> mainnet
    // Create new claim factory instance
    claimFactory = await ClaimFactory.new(
      token.address,
      registry.address,
      stakingProxyKey,
      serviceProviderFactoryKey,
<<<<<<< HEAD
      delegateManagerKey,
      { from: accounts[0] })
=======
      { from: treasuryAddress })
>>>>>>> mainnet

    await registry.addContract(claimFactoryKey, claimFactory.address)

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: treasuryAddress })

    mockGovernance = await MockGovernance.new(
      registry.address,
      delegateManagerKey,
      { from: accounts[0] })

    delegateManager = await DelegateManager.new(
      token.address,
      registry.address,
<<<<<<< HEAD
      mockGovernance.address,
      ownedUpgradeabilityProxyKey,
=======
      stakingProxyKey,
>>>>>>> mainnet
      serviceProviderFactoryKey,
      claimFactoryKey)

    await registry.addContract(delegateManagerKey, delegateManager.address)
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

  const increaseRegisteredProviderStake = async (increase, account) => {
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

  const decreaseRegisteredProviderStake = async (decrease, account) => {
    // Approve token transfer from staking contract to account
    let tx = await serviceProviderFactory.decreaseStake(
      decrease,
      { from: account })

    let args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    // console.dir(args, { depth: 5 })
  }

  const getAccountStakeInfo = async (account, print = false) => {
    let spFactoryStake
    let totalInStakingContract
    spFactoryStake = await serviceProviderFactory.getServiceProviderStake(account)
    totalInStakingContract = await staking.totalStakedFor(account)

    let delegatedStake = await delegateManager.getTotalDelegatedToServiceProvider(account)
    let lockedUpStake = await delegateManager.getTotalLockedDelegationForServiceProvider(account)
    let delegatorInfo = {}
    let delegators = await delegateManager.getDelegatorsList(account)
    for (var i = 0; i < delegators.length; i++) {
      let amountDelegated = await delegateManager.getTotalDelegatorStake(delegators[i])
      let amountDelegatedtoSP = await delegateManager.getDelegatorStakeForServiceProvider(delegators[i], account)
      let pendingUndelegateRequest = await delegateManager.getPendingUndelegateRequest(delegators[i])
      delegatorInfo[delegators[i]] = {
        amountDelegated,
        amountDelegatedtoSP,
        pendingUndelegateRequest
      }
    }
    let outsideStake = spFactoryStake.add(delegatedStake)
    let totalActiveStake = outsideStake.sub(lockedUpStake)
    let stakeDiscrepancy = totalInStakingContract.sub(outsideStake)
    let accountSummary = {
      totalInStakingContract,
      delegatedStake,
      spFactoryStake,
      delegatorInfo,
      outsideStake,
      lockedUpStake,
      totalActiveStake
    }

    if (print) {
      console.log(`${account} SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}`)
      console.log(`${account} Outside Stake: ${outsideStake} Staking: ${totalInStakingContract}`)
      console.log(`(Staking) vs (DelegateManager + SPFactory) Stake discrepancy: ${stakeDiscrepancy}`)
      console.dir(accountSummary, { depth: 5 })
    }
    return accountSummary
  }

  describe('Delegation tests', () => {
    let regTx

    beforeEach(async () => {
      // Transfer 1000 tokens to stakers
      await token.transfer(stakerAccount, INITIAL_BAL, { from: treasuryAddress })
      await token.transfer(stakerAccount2, INITIAL_BAL, { from: treasuryAddress })
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

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

      // Update SP Deployer Cut to 10%
      await serviceProviderFactory.updateServiceProviderCut(stakerAccount, 10, { from: stakerAccount })
      await serviceProviderFactory.updateServiceProviderCut(stakerAccount2, 10, { from: stakerAccount2 })
    })

    it('initial state + claim', async () => {
      // Validate basic claim w/SP path
      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalStakedForAccount = await staking.totalStakedFor(stakerAccount)

      await claimFactory.initiateRound()

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)

      await delegateManager.claimRewards({ from: stakerAccount })

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
      await delegateManager.delegateStake(
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

      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 }
      )

      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(initialDelegateAmount),
        'Expected amount not found in lockup')

      let totalLockedDelegation =
        await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)
      assert.isTrue(
        totalLockedDelegation.eq(initialDelegateAmount),
        'Expected amount not found in total lockup for SP')

      // Try to undelegate stake immediately, confirm failure
      await _lib.assertRevert(
        delegateManager.undelegateStake({ from: delegatorAccount1 }),
        'Lockup must be expired'
      )
      // Try to submit another request, expect revert
      await _lib.assertRevert(
        delegateManager.requestUndelegateStake(
          stakerAccount,
          initialDelegateAmount,
          { from: delegatorAccount1 }),
          'No pending lockup expiry allowed'
      )

      // Advance to valid block
      await _lib.advanceToTargetBlock(
        fromBn(undelegateRequestInfo.lockupExpiryBlock),
        web3
      )

      // Undelegate stake
      delegateManager.undelegateStake({ from: delegatorAccount1 })

      // Confirm all state change operations have occurred
      undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegators = await delegateManager.getDelegatorsList(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      totalLockedDelegation =
        await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)
      assert.equal(
        delegators.length,
        0,
        'Expect no remaining delegators')
      assert.equal(
        delegatedStake,
        0,
        'Expect no remaining total delegate stake')
      assert.equal(
        totalLockedDelegation,
        0,
        'Expect no remaining locked stake for SP')
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

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let deployerCut = await serviceProviderFactory.getServiceProviderDeployerCut(stakerAccount)
      let deployerCutBase = await serviceProviderFactory.getServiceProviderDeployerCutBase()

      // Initiate round
      await claimFactory.initiateRound()

      // Confirm claim is pending
      let pendingClaim = await claimFactory.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimFactory expected to consider claim pending')

      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalStake = await staking.totalStaked()
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let totalValueOutsideStaking = spStake.add(delegatedStake)
      let fundingAmount = await claimFactory.getFundsPerRound()
      let totalRewards = (totalStakedForSP.mul(fundingAmount)).div(totalStake)

      // Manually calculate expected value prior to making claim
      // Identical math as contract
      let delegateRewardsPriorToSPCut = (delegatedStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let spDeployerCut = (delegateRewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase)
      let delegateRewards = delegateRewardsPriorToSPCut.sub(spDeployerCut)
      let expectedDelegateStake = delegatedStake.add(delegateRewards)
      let spRewardShare = (spStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let expectedSpStake = spStake.add(spRewardShare.add(spDeployerCut))

      await delegateManager.claimRewards({ from: stakerAccount })

      let finalSpStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let finalDelegateStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)

      assert.isTrue(finalSpStake.eq(expectedSpStake), 'Expected SP stake matches found value')
      assert.isTrue(finalDelegateStake.eq(expectedDelegateStake), 'Expected delegate stake matches found value')
    })

    it('single delegator + claim + slash', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Fund new claim
      await claimFactory.initiateRound()

      // Get rewards
      await delegateManager.claimRewards({ from: stakerAccount })
      await delegateManager.claimRewards({ from: stakerAccount2 })

      // Slash 30% of total
      let slashNumerator = web3.utils.toBN(30)
      let slashDenominator = web3.utils.toBN(100)
      let totalInStakingContract = await staking.totalStakedFor(slasherAccount)
      let slashAmount = (totalInStakingContract.mul(slashNumerator)).div(slashDenominator)

      // Perform slash functions
      // Called from mockGovernance
      await mockGovernance.testSlash(slashAmount, slasherAccount)

      // Summarize after execution
      let spFactoryStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalInStakingAfterSlash = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let outsideStake = spFactoryStake.add(delegatedStake)
      let stakeDiscrepancy = totalInStakingAfterSlash.sub(outsideStake)
      let totalStaked = await staking.totalStaked()
      let tokensAtStakingAddress = await token.balanceOf(stakingAddress)

      assert.equal(stakeDiscrepancy, 0, 'Equal tokens expected inside/outside Staking')
      assert.isTrue(totalStaked.eq(tokensAtStakingAddress), 'Expect equivalency between Staking contract and ERC')
      assert.isTrue(totalInStakingAfterSlash.eq(outsideStake), 'Expected SP/delegatemanager to equal staking')
      assert.isTrue((totalInStakingContract.sub(slashAmount)).eq(totalInStakingAfterSlash), 'Expected slash value')
    })

    it('40 delegators to one SP + claim', async () => {
      // TODO: Validate all
      let totalStakedForSP = await staking.totalStakedFor(stakerAccount)

      let numDelegators = 40
      if (accounts.length < numDelegators) {
        // Disabled for CI, pending modification of total accounts
        console.log(`Insufficient accounts found - required ${numDelegators}, found ${accounts.length}`)
        return
      }

      let delegateAccountOffset = 4
      let delegatorAccounts = accounts.slice(delegateAccountOffset, delegateAccountOffset + numDelegators)
      let totalDelegationAmount = DEFAULT_AMOUNT
      let singleDelegateAmount = totalDelegationAmount.div(web3.utils.toBN(numDelegators))

      for (var delegator of delegatorAccounts) {
        // Transfer 1000 tokens to each delegator
        await token.transfer(delegator, INITIAL_BAL, { from: treasuryAddress })
        // Approve staking transfer
        await token.approve(
          stakingAddress,
          singleDelegateAmount,
          { from: delegator })

        await delegateManager.delegateStake(
          stakerAccount,
          singleDelegateAmount,
          { from: delegator })

        let delegatorStake = await delegateManager.getTotalDelegatorStake(delegator)  
        let delegatorStakeForSP = await delegateManager.getDelegatorStakeForServiceProvider(
          delegator,
          stakerAccount)
        assert.isTrue(
          delegatorStake.eq(singleDelegateAmount),
          'Expected total delegator stake to match input')
        assert.isTrue(
          delegatorStakeForSP.eq(singleDelegateAmount),
          'Expected total delegator stake to SP to match input')
      }

      let totalSPStakeAfterDelegation = await staking.totalStakedFor(stakerAccount)
      let expectedTotalStakeAfterDelegation = totalStakedForSP.add(totalDelegationAmount)
      assert.isTrue(
        totalSPStakeAfterDelegation.eq(expectedTotalStakeAfterDelegation),
        `Total value inconsistent after all delegation. Expected ${fromBn(expectedTotalStakeAfterDelegation)}, found ${fromBn(totalSPStakeAfterDelegation)}`)

      // Initiate round
      await claimFactory.initiateRound()

      let deployerCut = await serviceProviderFactory.getServiceProviderDeployerCut(stakerAccount)
      let deployerCutBase = await serviceProviderFactory.getServiceProviderDeployerCutBase()

      // Calculating expected values
      let spStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      let totalStake = await staking.totalStaked()
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let totalDelegatedStake = web3.utils.toBN(0)
      for (let delegator of delegatorAccounts) {
        let delegatorStake = await delegateManager.getTotalDelegatorStake(delegator)
        totalDelegatedStake = totalDelegatedStake.add(delegatorStake)
      }

      let totalValueOutsideStaking = spStake.add(totalDelegatedStake)
      assert.isTrue(
        totalStakedForSP.eq(totalValueOutsideStaking),
        'Expect equivalent value between staking contract and protocol contracts')

      let fundingAmount = await claimFactory.getFundsPerRound()
      let totalRewards = (totalStakedForSP.mul(fundingAmount)).div(totalStake)

      let spDelegationRewards = web3.utils.toBN(0)
      // Expected value for each delegator
      let expectedDelegateStakeDictionary = {}
      for (let delegator of delegatorAccounts) {
        let delegatorStake = await delegateManager.getTotalDelegatorStake(delegator)
        let delegateRewardsPriorToSPCut = (delegatorStake.mul(totalRewards)).div(totalValueOutsideStaking)
        let spDeployerCut = (delegateRewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase)
        let delegateRewards = delegateRewardsPriorToSPCut.sub(spDeployerCut)
        // Update dictionary of expected values
        let expectedDelegateStake = delegatorStake.add(delegateRewards)
        expectedDelegateStakeDictionary[delegator] = expectedDelegateStake
        spDelegationRewards = spDelegationRewards.add(spDeployerCut)
      }

      // Expected value for SP
      let spRewardShare = (spStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let expectedSpStake = spStake.add(spRewardShare.add(spDelegationRewards))

      // Perform claim
      let claimTx = await delegateManager.claimRewards({ from: stakerAccount })
      // console.dir(claimTx, { depth: 5 })
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)

      // Validate final SP value vs expected
      let finalSpStake = await serviceProviderFactory.getServiceProviderStake(stakerAccount)
      assert.isTrue(finalSpStake.eq(expectedSpStake), 'Expected SP stake matches found value')
      // Validate each delegate value against expected
      for (let delegator of delegatorAccounts) {
        let finalDelegatorStake = await delegateManager.getTotalDelegatorStake(delegator)
        let expectedDelegatorStake = expectedDelegateStakeDictionary[delegator]
        assert.isTrue(
          finalDelegatorStake.eq(expectedDelegatorStake),
          'Unexpected delegator stake after claim is made')
      }
    })

    // Confirm a pending undelegate operation negates any claimed value
    it('single delegator + undelegate + claim', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: treasuryAddress })

      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 }
      )

      let preRewardInfo = await getAccountStakeInfo(stakerAccount, false)

      // Initiate round
      await claimFactory.initiateRound()
      await delegateManager.claimRewards({ from: stakerAccount })
      let postRewardInfo = await getAccountStakeInfo(stakerAccount, false)

      let preRewardDelegation = preRewardInfo.delegatorInfo[delegatorAccount1].amountDelegated
      let postRewardDelegation = postRewardInfo.delegatorInfo[delegatorAccount1].amountDelegated
      assert.isTrue(
        preRewardDelegation.eq(postRewardDelegation),
        'Confirm no reward issued to delegator')
      let preRewardStake = preRewardInfo.totalInStakingContract
      let postRewardStake = postRewardInfo.totalInStakingContract
      assert.isTrue(
        postRewardStake.gt(preRewardStake),
        'Confirm reward issued to service provider')
    })

    // Confirm a pending undelegate operation is negated by a slash to the account
    it('single delegator + undelegate + slash', async () => {
      let initialDelegateAmount = toWei(60)
      let slashAmount = toWei(100)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 }
      )

      let preSlashInfo = await getAccountStakeInfo(stakerAccount, false)
      let preSlashLockupStake = preSlashInfo.lockedUpStake
      assert.isTrue(
        preSlashLockupStake.eq(initialDelegateAmount),
        'Initial delegate amount not found')

      // Perform slash functions
      // Called from mockGovernance
      await mockGovernance.testSlash(slashAmount, slasherAccount)

      let postRewardInfo = await getAccountStakeInfo(stakerAccount, false)

      let postSlashLockupStake = postRewardInfo.lockedUpStake
      assert.equal(
        postSlashLockupStake,
        0,
        'Expect no lockup funds to carry over')
    })

    it('single delegator to invalid SP', async () => {
      let initialDelegateAmount = toWei(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Confirm maximum bounds exceeded for SP w/zero endpoints
      await _lib.assertRevert(
        delegateManager.delegateStake(
          accounts[8],
          initialDelegateAmount,
          { from: delegatorAccount1 }),
        'Maximum stake amount exceeded'
      )
    })


    it('3 delegators + pending claim + undelegate restrictions', async () => {
      const delegatorAccount2 = accounts[5]
      const delegatorAccount3 = accounts[6]
      // Transfer 1000 tokens to delegator2, delegator3
      await token.transfer(delegatorAccount2, INITIAL_BAL, { from: treasuryAddress })
      await token.transfer(delegatorAccount3, INITIAL_BAL, { from: treasuryAddress })
      let initialDelegateAmount = toWei(60)

      // Approve staking transfer for delegator 1
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Stake initial value for delegator 1
      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 }
      )

      // Approve staking transfer for delegator 3
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount3 })

      // Stake initial value for delegator 3
      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount3 })

      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(initialDelegateAmount),
        'Expect request to match undelegate amount')

      // Advance to valid block
      await _lib.advanceToTargetBlock(
        fromBn(undelegateRequestInfo.lockupExpiryBlock),
        web3
      )
      let currentBlock = await web3.eth.getBlock('latest')
      let currentBlockNum = currentBlock.number
      assert.isTrue(
        (web3.utils.toBN(currentBlockNum)).gte(undelegateRequestInfo.lockupExpiryBlock),
        'Confirm expired lockup period')

      // Initiate round
      await claimFactory.initiateRound()

      // Confirm claim is pending
      let pendingClaim = await claimFactory.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimFactory expected to consider claim pending')

      // Attempt to finalize undelegate stake request
      await _lib.assertRevert(
        delegateManager.undelegateStake({ from: delegatorAccount1 }),
        'Undelegate not permitted for SP pending claim'
      )

      // Approve staking transfer for delegator 2
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount2 })

      // Attempt to delegate
      await _lib.assertRevert(
        delegateManager.delegateStake(
          stakerAccount,
          initialDelegateAmount,
          { from: delegatorAccount1 }),
        'Delegation not permitted for SP pending claim'
      )

      // Submit request to undelegate for delegator 3
      await _lib.assertRevert(
        delegateManager.requestUndelegateStake(
          stakerAccount,
          initialDelegateAmount,
          { from: delegatorAccount3 }),
        'Undelegate request not permitted for SP'
      )

      await delegateManager.claimRewards({ from: stakerAccount })
    })

    it('slash below sp bounds', async () => {
      let preSlashInfo = await getAccountStakeInfo(stakerAccount, false)
      // Set slash amount to all but 1 AUD for this SP
      let diffAmount = toWei(1)
      let slashAmount = (preSlashInfo.spFactoryStake).sub(diffAmount)

      // Perform slash functions
      // Called from mockGovernance
      await mockGovernance.testSlash(slashAmount, slasherAccount)

      let isWithinBounds = await serviceProviderFactory.isServiceProviderWithinBounds(slasherAccount)
      assert.isFalse(
        isWithinBounds,
        'Bound violation expected')

      // Initiate round
      await claimFactory.initiateRound()

      // Confirm claim is pending
      let pendingClaim = await claimFactory.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimFactory expected to consider claim pending')

      // Confirm claim fails due to bound violation
      await _lib.assertRevert(
        delegateManager.claimRewards({ from: stakerAccount }),
        'Service provider must be within bounds'
      )

      // Try to increase by diffAmount, but expect rejection since lower bound is unmet
      await _lib.assertRevert(
        increaseRegisteredProviderStake(
          diffAmount,
          stakerAccount),
        'Minimum stake threshold exceeded')

      // Increase to minimum
      let bounds = await serviceProviderFactory.getAccountStakeBounds(stakerAccount)
      let info = await getAccountStakeInfo(stakerAccount, false)
      let increase = (bounds.min).sub(info.spFactoryStake)
      // Increase to minimum bound
      await increaseRegisteredProviderStake(
        increase,
        stakerAccount)

      // Validate increase
      isWithinBounds = await serviceProviderFactory.isServiceProviderWithinBounds(slasherAccount)
      assert.isTrue(
        isWithinBounds,
        'Valid bound expected')

      // Confirm claim STILL fails due to bound violation at fundblock
      await _lib.assertRevert(
        delegateManager.claimRewards({ from: stakerAccount }),
        'Minimum stake bounds violated at fund block'
      )
    })

    it('delegator increase/decrease + SP direct stake bound validation', async () => {
      let bounds = await serviceProviderFactory.getAccountStakeBounds(stakerAccount)
      let delegateAmount = bounds.min
      let info = await getAccountStakeInfo(stakerAccount, false)
      let failedIncreaseAmount = bounds.max
      // Transfer sufficient funds
      await token.transfer(delegatorAccount1, failedIncreaseAmount, { from: treasuryAddress })
      // Approve staking transfer
      await token.approve(stakingAddress, failedIncreaseAmount, { from: delegatorAccount1 })
      await _lib.assertRevert(
        delegateManager.delegateStake(
          stakerAccount,
          failedIncreaseAmount,
          { from: delegatorAccount1 }),
        'Maximum stake amount exceeded'
      )
      let infoAfterFailure = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (info.delegatedStake).eq(infoAfterFailure.delegatedStake),
        'No increase in delegated stake expected')

      // Delegate min stake amount
      await token.approve(
        stakingAddress,
        delegateAmount,
        { from: delegatorAccount1 })
      delegateManager.delegateStake(
        stakerAccount,
        delegateAmount,
        { from: delegatorAccount1 })

      // Remove deployer direct stake
      // Decrease by all but 1 AUD direct stake
      let spFactoryStake = infoAfterFailure.spFactoryStake
      let diff = toWei(1)
      // Confirm failure as direct stake threshold is violated
      // Due to the total delegated stake equal to min bounds, total account stake balance will NOT violate bounds
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(spFactoryStake.sub(diff), stakerAccount),
        'Direct stake restriction violated for this service provider'
      )

      // Decrease to min
      let spInfo = await getAccountStakeInfo(stakerAccount, false)
      let minDirectStake = await serviceProviderFactory.getMinDeployerStake()
      let diffToMin = (spInfo.spFactoryStake).sub(minDirectStake)
      await decreaseRegisteredProviderStake(diffToMin, stakerAccount)
      let infoAfterDecrease = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (infoAfterDecrease.spFactoryStake).eq(minDirectStake),
        'Expect min direct stake while within total account bounds')

      // At this point we have a total stake of 2x the minimum for this SP
      // 1x Min directly from SP
      // 1x Min from our single delegator
      // So - a service provider should be able to register with NO additional stake and still be within bounds
      await registerServiceProvider(
        testDiscProvType,
        testEndpoint3,
        toWei(0),
        stakerAccount)

      let infoAfterSecondEndpoint = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (infoAfterSecondEndpoint.totalInStakingContract).eq(infoAfterDecrease.totalInStakingContract),
        'Expect static total stake after new SP endpoint'
      )

      // Now, initiate a request to undelegate for this SP
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        delegateAmount,
        { from: delegatorAccount1 }
      )
      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(delegateAmount),
        'Expect request to match undelegate amount')

      // Advance to valid block
      await _lib.advanceToTargetBlock(
        fromBn(undelegateRequestInfo.lockupExpiryBlock),
        web3
      )
      let currentBlock = await web3.eth.getBlock('latest')
      let currentBlockNum = currentBlock.number
      assert.isTrue(
        (web3.utils.toBN(currentBlockNum)).gte(undelegateRequestInfo.lockupExpiryBlock),
        'Confirm expired lockup period')
      // Try to execute undelegate stake, but fail due to min bound violation
      await _lib.assertRevert(
        delegateManager.undelegateStake({ from: delegatorAccount1 }),
        'Minimum stake threshold exceeded')
    })
  })
})
