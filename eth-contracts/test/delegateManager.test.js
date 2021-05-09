import * as _lib from '../utils/lib.js'
const { time, expectEvent } = require('@openzeppelin/test-helpers')

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const Staking = artifacts.require('Staking')
const DelegateManager = artifacts.require('DelegateManager')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const tokenRegKey = web3.utils.utf8ToHex('Token')

const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
const serviceTypeMinStake = _lib.audToWei(5)
const serviceTypeMaxStake = _lib.audToWei(10000000)
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'
const testEndpoint2 = 'https://localhost:6001'
const testEndpoint3 = 'https://localhost:5002'
const testEndpoint4 = 'https://localhost:5009'
const testEndpoint5 = 'https://localhost:5010'


const INITIAL_BAL = _lib.audToWeiBN(10000000)
const DEFAULT_AMOUNT_VAL = _lib.audToWei(120)
const DEFAULT_AMOUNT = _lib.toBN(DEFAULT_AMOUNT_VAL)
const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10
const DEPLOYER_CUT_LOCKUP_DURATION = 11
const UNDELEGATE_LOCKUP_DURATION = VOTING_PERIOD + EXECUTION_DELAY + 1
const DECREASE_STAKE_LOCKUP_DURATION = UNDELEGATE_LOCKUP_DURATION

const callValue0 = _lib.toBN(0)


contract('DelegateManager', async (accounts) => {
  let staking, stakingAddress, token, registry, governance
  let serviceProviderFactory, serviceTypeManager, claimsManager, delegateManager

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress
  const stakerAccount = accounts[10]
  const stakerAccount2 = accounts[12]
  const stakerAccount3 = accounts[14]
  const stakerAccount4 = accounts[15]
  const stakerAccount5 = accounts[16]
  const stakerAccount6 = accounts[17]
  const delegatorAccount1 = accounts[11]
  const slasherAccount = stakerAccount

  /**
   * Initialize Registry, Governance, Token, Staking, ServiceTypeManager, ServiceProviderFactory, ClaimsManager, DelegateManager
   * Register discprov serviceType
   */
  beforeEach(async () => {
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register Governance contract
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      VOTING_PERIOD,
      EXECUTION_DELAY,
      VOTING_QUORUM_PERCENT,
      guardianAddress
    )
    await registry.addContract(governanceKey, governance.address, { from: proxyDeployerAddress })

    // Deploy + register token
    token = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    // Deploy + register Staking
    const staking0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    const stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      governance.address,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(stakingProxy.address)
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: proxyDeployerAddress })
    stakingAddress = staking.address

    // Deploy + register ServiceTypeManager
    let serviceTypeInitializeData = _lib.encodeCall(
      'initialize', ['address'], [governance.address]
    )
    let serviceTypeManager0 = await ServiceTypeManager.new({ from: proxyDeployerAddress })
    let serviceTypeManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      governance.address,
      serviceTypeInitializeData,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address, { from: proxyDeployerAddress })
    serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)

    // Register discprov serviceType
    await _lib.addServiceType(testDiscProvType, serviceTypeMinStake, serviceTypeMaxStake, governance, guardianAddress, serviceTypeManagerProxyKey)

    claimsManager = await _lib.deployClaimsManager(
      artifacts,
      registry,
      governance,
      proxyDeployerAddress,
      guardianAddress,
      token.address,
      10,
      claimsManagerProxyKey
    )

    // Deploy ServiceProviderFactory
    let serviceProviderFactory0 = await ServiceProviderFactory.new({ from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256', 'uint256'],
      [
        governance.address,
        claimsManager.address,
        DECREASE_STAKE_LOCKUP_DURATION,
        DEPLOYER_CUT_LOCKUP_DURATION
      ]
    )
    let serviceProviderFactoryProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory0.address,
      governance.address,
      serviceProviderFactoryCalldata,
      { from: proxyDeployerAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: proxyDeployerAddress })

    // Register new ClaimsManager contract as a minter, from the same address that deployed the contract
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [claimsManager.address]),
      { from: guardianAddress }
    )

    const delegateManagerInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256'],
      [token.address, governance.address, UNDELEGATE_LOCKUP_DURATION]
    )
    let delegateManager0 = await DelegateManager.new({ from: proxyDeployerAddress })
    let delegateManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      delegateManager0.address,
      governance.address,
      delegateManagerInitializeData,
      { from: proxyDeployerAddress }
    )

    delegateManager = await DelegateManager.at(delegateManagerProxy.address)
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: proxyDeployerAddress })

    // ---- Configuring addresses
    await _lib.configureGovernanceContractAddresses(
      governance,
      governanceKey,
      guardianAddress,
      stakingProxy.address,
      serviceProviderFactory.address,
      delegateManager.address
    )
    // ---- Set up staking contract permissions
    await _lib.configureStakingContractAddresses(
      governance,
      guardianAddress,
      stakingProxyKey,
      staking,
      serviceProviderFactoryProxy.address,
      claimsManager.address,
      delegateManagerProxy.address
    )

    // ---- Set up claims manageer contract permissions
    await _lib.configureClaimsManagerContractAddresses(
      governance,
      guardianAddress,
      claimsManagerProxyKey,
      claimsManager,
      staking.address,
      serviceProviderFactory.address,
      delegateManager.address
    )

    // ---- Set up delegateManager  contract permissions
    //   return { spFactoryTx, claimsManagerTx, stakingTx, governanceTx }

    let initTxs = await _lib.configureDelegateManagerAddresses(
      governance,
      guardianAddress,
      delegateManagerKey,
      delegateManager,
      staking.address,
      serviceProviderFactory.address,
      claimsManager.address
    )
    await expectEvent.inTransaction(
      initTxs.spFactoryTx.tx,
      DelegateManager,
      'ServiceProviderFactoryAddressUpdated',
      { _newServiceProviderFactoryAddress: serviceProviderFactory.address }
    )
    await expectEvent.inTransaction(
      initTxs.stakingTx.tx,
      DelegateManager,
      'StakingAddressUpdated',
      { _newStakingAddress: staking.address }
    )
    await expectEvent.inTransaction(
      initTxs.governanceTx.tx,
      DelegateManager,
      'GovernanceAddressUpdated',
      { _newGovernanceAddress: governance.address }
    )
    await expectEvent.inTransaction(
      initTxs.claimsManagerTx.tx,
      DelegateManager,
      'ClaimsManagerAddressUpdated',
      { _newClaimsManagerAddress: claimsManager.address }
    )

    // ---- Set up spFactory  contract permissions
    await _lib.configureServiceProviderFactoryAddresses(
      governance,
      guardianAddress,
      serviceProviderFactoryKey,
      serviceProviderFactory,
      staking.address,
      serviceTypeManagerProxy.address,
      claimsManager.address,
      delegateManagerProxy.address
    )

    // Clear min delegation amount for testing
    let updateTx = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'updateMinDelegationAmount(uint256)',
      _lib.abiEncode(['uint256'], [0]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      updateTx.tx,
      DelegateManager,
      'MinDelegationUpdated',
      { _minDelegationAmount: '0' }
    )
    // Expect revert for 8 since it is below votingPeriod + votingDelay
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        delegateManagerKey,
        _lib.toBN(0),
        'updateRemoveDelegatorLockupDuration(uint256)',
        _lib.abiEncode(['uint256'], [8]),
        { from: guardianAddress }
      )
    )
    // Reset lockup and eval duration for testing
    updateTx = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'updateRemoveDelegatorLockupDuration(uint256)',
      _lib.abiEncode(['uint256'], [100]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      updateTx.tx,
      DelegateManager,
      'RemoveDelegatorLockupDurationUpdated',
      { _removeDelegatorLockupDuration: '100' }
    )
    updateTx = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'updateRemoveDelegatorEvalDuration(uint256)',
      _lib.abiEncode(['uint256'], [10]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      updateTx.tx,
      DelegateManager,
      'RemoveDelegatorEvalDurationUpdated',
      { _removeDelegatorEvalDuration: '10' }
    )
  })

  /* Helper functions */
  const updateMinDelegationAmount = async (amount) => {
    let updateTx = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'updateMinDelegationAmount(uint256)',
      _lib.abiEncode(['uint256'], [amount]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      updateTx.tx, DelegateManager, 'MinDelegationUpdated',
      { _minDelegationAmount: `${amount}` }
    )
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
  }

  const decreaseRegisteredProviderStake = async (decrease, account) => {
    try {
      // Request decrease in stake
      await serviceProviderFactory.requestDecreaseStake(decrease, { from: account })
      let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(account)
      // Advance to valid block
      await time.advanceBlockTo(requestInfo.lockupExpiryBlock)
      // Approve token transfer from staking contract to account
      await serviceProviderFactory.decreaseStake({ from: account })
    } catch (e) {
      // Cancel request
      await serviceProviderFactory.cancelDecreaseStakeRequest(account, { from: account })
      throw e
    }
  }

  /*
     Function to re-calculate expected delegator stake total given
      list of types and IDs, and compare calculated value with 
      delegator balance tracked on chain
  */
  const getTotalDelegatorStake = async (delegator) => {
    let validTypes = await serviceTypeManager.getValidServiceTypes()
    let totalDelegatorStake = _lib.toBN(0)
    // Track whether we have processed a given service provider
    // A single SP can have >1 endpoint and we don't need to double count
    let uniqueSPs = new Set()
    for (const serviceType of validTypes) {
      let numTypeIds = await serviceProviderFactory.getTotalServiceTypeProviders(serviceType)
      let i = 1
      while (i <= numTypeIds) {
        let info = await serviceProviderFactory.getServiceEndpointInfo(serviceType, i)
        uniqueSPs.add(info.owner)
       i++
      }
    }

    let spsArray = Array.from(uniqueSPs)
    for (const sp of spsArray) {
      let totalDelegatedToOwner = await delegateManager.getDelegatorStakeForServiceProvider(delegator, sp)
      totalDelegatorStake = totalDelegatorStake.add(totalDelegatedToOwner)
    }

    let newTotalFromContract = await delegateManager.getTotalDelegatorStake(delegator)
    assert.isTrue(
      newTotalFromContract.eq(totalDelegatorStake),
      `ERROR STATE Calculated:${totalDelegatorStake}, newTotalFromContract:${newTotalFromContract}`
    )
    return totalDelegatorStake
  }

  const getAccountStakeInfo = async (account, print = false) => {
    let spFactoryStake
    let totalInStakingContract

    let spDetails = await serviceProviderFactory.getServiceProviderDetails(account)
    spFactoryStake = spDetails.deployerStake
    totalInStakingContract = await staking.totalStakedFor(account)
    let spDecreaseRequest = await serviceProviderFactory.getPendingDecreaseStakeRequest(account)

    let delegatedStake = await delegateManager.getTotalDelegatedToServiceProvider(account)
    let lockedUpDelegatorStake = await delegateManager.getTotalLockedDelegationForServiceProvider(account)
    let delegatorInfo = {}
    let delegators = await delegateManager.getDelegatorsList(account)
    for (var i = 0; i < delegators.length; i++) {
      let amountDelegated = await getTotalDelegatorStake(delegators[i])
      let amountDelegatedtoSP = await delegateManager.getDelegatorStakeForServiceProvider(delegators[i], account)
      let pendingUndelegateRequest = await delegateManager.getPendingUndelegateRequest(delegators[i])
      delegatorInfo[delegators[i]] = {
        amountDelegated,
        amountDelegatedtoSP,
        pendingUndelegateRequest
      }
    }
    let outsideStake = spFactoryStake.add(delegatedStake)
    let totalActiveStake = outsideStake.sub(lockedUpDelegatorStake)
    let stakeDiscrepancy = totalInStakingContract.sub(outsideStake)
    let accountSummary = {
      totalInStakingContract,
      delegatedStake,
      spFactoryStake,
      delegatorInfo,
      outsideStake,
      lockedUpDelegatorStake,
      totalActiveStake,
      spDecreaseRequest,
      delegators
    }

    if (print) {
      console.log(`${account} SpFactory: ${spFactoryStake}, DelegateManager: ${delegatedStake}`)
      console.log(`${account} Outside Stake: ${outsideStake} Staking: ${totalInStakingContract}`)
      console.log(`(Staking) vs (DelegateManager + SPFactory) Stake discrepancy: ${stakeDiscrepancy}`)
      console.dir(accountSummary, { depth: 5 })
    }

    return Object.assign(accountSummary, spDetails)
  }

  const validateAccountStakeBalance = async (account) => {
    let info = await getAccountStakeInfo(account)
    assert.isTrue(
      info.totalInStakingContract.eq(info.outsideStake),
      `Imbalanced stake for account ${account} - totalInStakingContract=${info.totalInStakingContract.toString()}, outside=${info.outsideStake.toString()}`
    )
    return info
  }

  describe('Delegation tests', () => {
    let regTx

    /**
     * Transfer tokens to stakers & delegator
     * Register service providers
     * Update SP deployer cuts
     */
    beforeEach(async () => {
      // Transfer 1000 tokens to stakers
      await token.transfer(stakerAccount, INITIAL_BAL, { from: proxyDeployerAddress })
      await token.transfer(stakerAccount2, INITIAL_BAL, { from: proxyDeployerAddress })
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let initialBal = await token.balanceOf(stakerAccount)

      regTx = await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount
      )
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint1,
        DEFAULT_AMOUNT,
        stakerAccount2
      )

      // Confirm event has correct amount
      assert.isTrue(regTx.stakeAmount.eq(DEFAULT_AMOUNT))

      // Confirm balance updated for tokens
      let finalBal = await token.balanceOf(stakerAccount)
      assert.isTrue(initialBal.eq(finalBal.add(DEFAULT_AMOUNT)), 'Expect funds to be transferred')

      let updatedCut = 10

      // Request Update SP Deployer Cut to 10%
      await serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, updatedCut, { from: stakerAccount })
      await serviceProviderFactory.requestUpdateDeployerCut(stakerAccount2, updatedCut, { from: stakerAccount2 })

      // Advance to 2nd update block number
      let pending2ndUpdate = await serviceProviderFactory.getPendingUpdateDeployerCutRequest(stakerAccount2)
      await time.advanceBlockTo(pending2ndUpdate.lockupExpiryBlock)

      // Evaluate both updates
      await serviceProviderFactory.updateDeployerCut(
        stakerAccount2,
        { from: stakerAccount2 }
      )
      await serviceProviderFactory.updateDeployerCut(
        stakerAccount,
        { from: stakerAccount }
      )

      // Confirm updates
      let info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(updatedCut)), 'Expect updated cut')
      info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount2)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(updatedCut)), 'Expect updated cut')
    })

    it('Initial state + claim', async () => {
      // Validate basic claim w/SP path
      let spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let totalStakedForAccount = await staking.totalStakedFor(stakerAccount)

      await claimsManager.initiateRound({ from: stakerAccount })

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake

      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      assert.isTrue(
        spStake.eq(totalStakedForAccount),
        'Stake value in SPFactory and Staking.sol must be equal')
    })

    it('Initial state + claim from different address', async () => {
      // Validate basic claim w/SP path
      let spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let totalStakedForAccount = await staking.totalStakedFor(stakerAccount)

      await claimsManager.initiateRound({ from: stakerAccount })

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake

      // Claim from a separate account to confirm claimRewards can be called by any address
      let claimerAddress = accounts[5]
      assert.isTrue(claimerAddress !== stakerAccount, 'Expected different claimer account')
      await delegateManager.claimRewards(stakerAccount, { from: claimerAddress })

      totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
      spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      assert.isTrue(
        spStake.eq(totalStakedForAccount),
        'Stake value in SPFactory and Staking.sol must be equal')
    })

    it('Claim zero for an address that has zero stake', async () => {
      await claimsManager.initiateRound({ from: stakerAccount })

      // Claim from a separate account to confirm claimRewards can be called by any address
      let claimerAddress = accounts[5]
      let fakeSPAddress = accounts[9]
      assert.isTrue(claimerAddress !== stakerAccount, 'Expected different claimer account')
      assert.isTrue(claimerAddress !== stakerAccount, 'Expected fake service provider address')
      let preClaimInfo = await getAccountStakeInfo(fakeSPAddress)

      let tx = await delegateManager.claimRewards(fakeSPAddress, { from: claimerAddress })
      let postClaimInfo = await getAccountStakeInfo(fakeSPAddress)
      assert.isTrue(
        postClaimInfo.totalInStakingContract.eq(preClaimInfo.totalInStakingContract),
        "Expect no reward for an account claiming"
      )
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'Claim',
        {
          _claimer: fakeSPAddress,
          _rewards: _lib.toBN(0),
          _newTotal: _lib.toBN(0)
        }
      )
    })

    it('Single delegator basic operations', async () => {
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let initialSpStake = totalStakedForSP
      let delegateAmount = _lib.audToWeiBN(60)

      let minDel = await delegateManager.getMinDelegationAmount()
      assert.isTrue(minDel.lte(delegateAmount), 'Must be above min delegation')

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        delegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        delegateAmount,
        { from: delegatorAccount1 })
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let delegators = await delegateManager.getDelegatorsList(stakerAccount)
      let spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake

      let delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
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

      // Increase delegated stake
      let increaseAmount = _lib.audToWeiBN(5)
      await token.approve(
        stakingAddress,
        increaseAmount,
        { from: delegatorAccount1 })
      await delegateManager.delegateStake(
        stakerAccount,
        increaseAmount,
        { from: delegatorAccount1 })
      assert.isTrue(
        (await getTotalDelegatorStake(delegatorAccount1)).eq(delegatedStake.add(increaseAmount)),
        'Confirm increase')

      delegatedStake = await getTotalDelegatorStake(delegatorAccount1)

      // Submit request to undelegate all stake
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        delegatedStake,
        { from: delegatorAccount1 }
      )

      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(delegatedStake),
        'Expected amount not found in lockup')

      let totalLockedDelegation =
        await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)
      assert.isTrue(
        totalLockedDelegation.eq(delegatedStake),
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
          delegatedStake,
          { from: delegatorAccount1 }),
        'No pending lockup expected'
      )

      // Advance to valid block
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)

      // Undelegate stake
      await delegateManager.undelegateStake({ from: delegatorAccount1 })

      // Confirm all state change operations have occurred
      undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegators = await delegateManager.getDelegatorsList(stakerAccount)
      delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      totalLockedDelegation =
        await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)
      assert.equal(delegators.length, 0, 'Expect no remaining delegators')
      assert.equal(delegatedStake, 0, 'Expect no remaining total delegate stake')
      assert.equal(totalLockedDelegation, 0, 'Expect no remaining locked stake for SP')
      assert.isTrue(initialSpStake.eq(totalStakedForSP), 'Staking.sol back to initial value')
    })

    it('Single delegator + claim', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let initialDelegateAmount = _lib.audToWeiBN(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      let tx = await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      let deployerCut = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerCut
      let deployerCutBase = await serviceProviderFactory.getServiceProviderDeployerCutBase()

      // Initiate round
      await claimsManager.initiateRound({ from: stakerAccount })

      // Confirm claim is pending
      let pendingClaim = await claimsManager.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimsManager expected to consider claim pending')

      let spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let totalStake = await staking.totalStaked()
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      let totalValueOutsideStaking = spStake.add(delegatedStake)
      let fundingAmount = await claimsManager.getFundsPerRound()
      let totalRewards = (totalStakedForSP.mul(fundingAmount)).div(totalStake)

      // Manually calculate expected value prior to making claim
      // Identical math as contract
      let delegateRewardsPriorToSPCut = (delegatedStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let spDeployerCut = (delegateRewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase)
      let delegateRewards = delegateRewardsPriorToSPCut.sub(spDeployerCut)
      let expectedDelegateStake = delegatedStake.add(delegateRewards)
      let spRewardShare = (spStake.mul(totalRewards)).div(totalValueOutsideStaking)
      let expectedSpStake = spStake.add(spRewardShare.add(spDeployerCut))

      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })

      let finalSpStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let finalDelegateStake = await getTotalDelegatorStake(delegatorAccount1)

      assert.isTrue(finalSpStake.eq(expectedSpStake), 'Expected SP stake matches found value')
      assert.isTrue(finalDelegateStake.eq(expectedDelegateStake), 'Expected delegate stake matches found value')
    })

    it('Undelegate after SP has deregistered', async () => {
      let initialDelegateAmount = _lib.audToWeiBN(60)
      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      let accountInfo = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        accountInfo.delegatorInfo[delegatorAccount1].amountDelegated.eq(initialDelegateAmount),
        'Expect initial delegate amount reflected')

      // Request decrease all of stake by deregistering SP
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        stakerAccount)
      let deregisterRequestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)

      await _lib.assertRevert(
        serviceProviderFactory.decreaseStake({ from: stakerAccount }),
        'Lockup must be expired'
      )

      await time.advanceBlockTo(deregisterRequestInfo.lockupExpiryBlock)

      // Withdraw all SP stake
      await serviceProviderFactory.decreaseStake({ from: stakerAccount })

      // Submit request to undelegate all stake
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 }
      )

      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      // Finalize undelegation, confirm operation is allowed
      await delegateManager.undelegateStake({ from: delegatorAccount1 })
      let finalDelegateStake = await getTotalDelegatorStake(delegatorAccount1)
      assert.isTrue(finalDelegateStake.eq(_lib.toBN(0)), 'No remaining stake expected')
    })

    it('Register 3rd service provider after round has completed', async () => {
      let stakerAccount3 = accounts[8]
      // Transfer 1000 tokens to delegator
      await token.transfer(stakerAccount3, INITIAL_BAL, { from: proxyDeployerAddress })
      // Fund new claim
      await claimsManager.initiateRound({ from: stakerAccount })
      // Get rewards
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
      await delegateManager.claimRewards(stakerAccount2, { from: stakerAccount2 })
      let fundBlock = await claimsManager.getLastFundedBlock()
      let blockDiff = await claimsManager.getFundingRoundBlockDiff()
      let roundEndBlock = fundBlock.add(blockDiff)
      await time.advanceBlockTo(roundEndBlock)
      // Confirm a new SP can be registered
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint3,
        DEFAULT_AMOUNT,
        stakerAccount3)
      let info = await getAccountStakeInfo(stakerAccount3, false)
      assert.isTrue((info.totalInStakingContract).eq(DEFAULT_AMOUNT), 'Expect stake')
      assert.isTrue((info.spFactoryStake).eq(DEFAULT_AMOUNT), 'Expect sp factory stake')
    })

    it('Single delegator + claim + slash', async () => {
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let initialDelegateAmount = _lib.audToWeiBN(60)

      // Set funding amount to 20AUD
      await governance.guardianExecuteTransaction(
        claimsManagerProxyKey,
        _lib.toBN(0),
        'updateFundingAmount(uint256)',
        _lib.abiEncode(['uint256'], [_lib.audToWei(20)]),
        { from: guardianAddress }
      )

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
      await claimsManager.initiateRound({ from: stakerAccount })

      // Get rewards
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
      await delegateManager.claimRewards(stakerAccount2, { from: stakerAccount2 })

      // Slash 30% of total
      const totalInStakingContract = await staking.totalStakedFor(slasherAccount)
      const slashAmountVal = _lib.audToWei((_lib.fromWei(totalInStakingContract)) * 30 / 100)
      const slashAmount = _lib.toBN(slashAmountVal)

      // Perform slash functions
      await _lib.slash(slashAmountVal, slasherAccount, governance, delegateManagerKey, guardianAddress)

      // Summarize after execution
      let spFactoryStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let totalInStakingAfterSlash = await staking.totalStakedFor(stakerAccount)
      let delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      let outsideStake = spFactoryStake.add(delegatedStake)
      let stakeDiscrepancy = totalInStakingAfterSlash.sub(outsideStake)
      let totalStaked = await staking.totalStaked()
      let tokensAtStakingAddress = await token.balanceOf(stakingAddress)

      assert.equal(stakeDiscrepancy, 0, 'Equal tokens expected inside/outside Staking')
      assert.isTrue(totalStaked.eq(tokensAtStakingAddress), 'Expect equivalency between Staking contract and ERC')
      assert.isTrue(totalInStakingAfterSlash.eq(outsideStake), 'Expected SP/delegatemanager to equal staking')
      assert.isTrue((totalInStakingContract.sub(slashAmount)).eq(totalInStakingAfterSlash), 'Expected slash value')
    })

    it('Slash restrictions', async () => {
      // Deregister endpoint, removing all stake
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        stakerAccount
      )
      // Query the resulting deregister operation
      let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
      // Advance to valid block
      await time.advanceBlockTo(requestInfo.lockupExpiryBlock)
      // Finalize withdrawal
      await serviceProviderFactory.decreaseStake({ from: stakerAccount })

      /** Perform slash functions */

      // Fail to slash more than currently staked
      await _lib.assertRevert(
        _lib.slash(DEFAULT_AMOUNT_VAL, slasherAccount, governance, delegateManagerKey, guardianAddress),
        "Governance: Transaction failed."
      )

      // Fail to slash more than currently staked
      await _lib.assertRevert(
        _lib.slash(DEFAULT_AMOUNT_VAL + 4, stakerAccount2, governance, delegateManagerKey, guardianAddress),
        "Governance: Transaction failed."
      )

      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      // Delegate equal stake to stakerAccount2
      // Approve staking transfer
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount2,
        DEFAULT_AMOUNT,
        { from: delegatorAccount1 })

      // Deregister endpoint, removing all direct stake
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint1,
        stakerAccount2)

      // Query the resulting deregister operation
      requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount2)
      // Advance to valid block
      await time.advanceBlockTo(requestInfo.lockupExpiryBlock)
      // Finalize withdrawal
      await serviceProviderFactory.decreaseStake({ from: stakerAccount2 })

      // Fail to slash account with zero stake
      await _lib.assertRevert(
        _lib.slash(DEFAULT_AMOUNT_VAL, stakerAccount2, governance, delegateManagerKey, guardianAddress),
        "Governance: Transaction failed."
      )
    })

    it('40 delegators to one SP + claim', async () => {
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
      await Promise.all(delegatorAccounts.map(async(delegator) => {
        // Transfer 1000 tokens to each delegator
        await token.transfer(delegator, INITIAL_BAL, { from: proxyDeployerAddress })
        // Approve staking transfer
        await token.approve(
          stakingAddress,
          singleDelegateAmount,
          { from: delegator })

        await delegateManager.delegateStake(
          stakerAccount,
          singleDelegateAmount,
          { from: delegator })

        let delegatorStake = await getTotalDelegatorStake(delegator)  
        let delegatorStakeForSP = await delegateManager.getDelegatorStakeForServiceProvider(
          delegator,
          stakerAccount)
        assert.isTrue(
          delegatorStake.eq(singleDelegateAmount),
          'Expected total delegator stake to match input')
        assert.isTrue(
          delegatorStakeForSP.eq(singleDelegateAmount),
          'Expected total delegator stake to SP to match input')
      }))

      let totalSPStakeAfterDelegation = await staking.totalStakedFor(stakerAccount)
      let expectedTotalStakeAfterDelegation = totalStakedForSP.add(totalDelegationAmount)
      assert.isTrue(
        totalSPStakeAfterDelegation.eq(expectedTotalStakeAfterDelegation),
        `Total value inconsistent after all delegation. Expected ${expectedTotalStakeAfterDelegation}, found ${totalSPStakeAfterDelegation}`)

      // Initiate round
      await claimsManager.initiateRound({ from: stakerAccount })

      let deployerCut = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerCut
      let deployerCutBase = await serviceProviderFactory.getServiceProviderDeployerCutBase()

      // Calculating expected values
      let spStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      let totalStake = await staking.totalStaked()
      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      let totalDelegatedStake = web3.utils.toBN(0)
      for (let delegator of delegatorAccounts) {
        let delegatorStake = await getTotalDelegatorStake(delegator)
        totalDelegatedStake = totalDelegatedStake.add(delegatorStake)
      }

      let totalValueOutsideStaking = spStake.add(totalDelegatedStake)
      assert.isTrue(
        totalStakedForSP.eq(totalValueOutsideStaking),
        'Expect equivalent value between staking contract and protocol contracts')

      let fundingAmount = await claimsManager.getFundsPerRound()
      let totalExpectedRewards = (totalStakedForSP.mul(fundingAmount)).div(totalStake)

      let spDeployerCutRewards = web3.utils.toBN(0)
      let totalDelegateStakeIncrease = web3.utils.toBN(0)

      // Expected value for each delegator
      let expectedDelegateStakeDictionary = {}
      await Promise.all(delegatorAccounts.map(async (delegator) => {
        let delegatorStake = await delegateManager.getDelegatorStakeForServiceProvider(delegator, stakerAccount)
        let delegateRewardsPriorToSPCut = (delegatorStake.mul(totalExpectedRewards)).div(totalValueOutsideStaking)
        let spDeployerCut = (delegateRewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase)
        let delegateRewards = delegateRewardsPriorToSPCut.sub(spDeployerCut)
        // Update dictionary of expected values
        let expectedDelegateStake = delegatorStake.add(delegateRewards)
        expectedDelegateStakeDictionary[delegator] = expectedDelegateStake
        // Update total deployer cut tracking
        spDeployerCutRewards = spDeployerCutRewards.add(spDeployerCut)
        // Update total delegated stake increase
        totalDelegateStakeIncrease = totalDelegateStakeIncrease.add(delegateRewards)
      }))

      // Expected value for SP
      let spRewardShare = (totalExpectedRewards.sub(totalDelegateStakeIncrease))
      let expectedSpStake = spStake.add(spRewardShare)
      let preClaimInfo = await validateAccountStakeBalance(stakerAccount)

      // Perform claim
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
      let postClaimInfo = await validateAccountStakeBalance(stakerAccount)

      totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      // Validate each delegate value against expected
      await Promise.all(delegatorAccounts.map(async (delegator) => {
        let finalDelegatorStake = await delegateManager.getDelegatorStakeForServiceProvider(delegator, stakerAccount)
        let expectedDelegatorStake = expectedDelegateStakeDictionary[delegator]
        assert.isTrue(
          finalDelegatorStake.eq(expectedDelegatorStake),
          `Unexpected delegator stake after claim is made - ${finalDelegatorStake.toString()}, expected ${expectedDelegatorStake.toString()}`
        )
      }))

      let finalRewards = postClaimInfo.totalInStakingContract.sub(preClaimInfo.totalInStakingContract)
      assert.isTrue(finalRewards.eq(totalExpectedRewards), `Expected ${totalExpectedRewards.toString()} in rewards, found ${finalRewards.toString()}`)

      // Validate final SP value vs expected
      let finalSpStake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).deployerStake
      assert.isTrue(
        finalSpStake.eq(expectedSpStake),
        `Expected SP stake matches found value. Found ${finalSpStake.toString()}, Expected ${expectedSpStake.toString()}`
      )
    })

    it('Undelegate partial amount', async () => {
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let initialDelegateAmount = _lib.audToWeiBN(60)

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      await delegateManager.delegateStake(
        stakerAccount,
        initialDelegateAmount,
        { from: delegatorAccount1 })

      let delStakeForSP = await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)
      let undelegateAmount = initialDelegateAmount.div(_lib.toBN(2))
      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        undelegateAmount,
        { from: delegatorAccount1 }
      )

      // Confirm lockup amount is registered
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(undelegateAmount),
        'Expect request to match undelegate amount')

      // Advance to valid block
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)

      let delegatorTokenBalance = await token.balanceOf(delegatorAccount1)
      await delegateManager.undelegateStake({ from: delegatorAccount1 })
      let delegatorBalanceAfterUndelegation = await token.balanceOf(delegatorAccount1)
      assert.isTrue((delegatorBalanceAfterUndelegation.sub(undelegateAmount)).eq(delegatorTokenBalance), 'Expect funds to be returned')

      let expectedStake = initialDelegateAmount.sub(undelegateAmount)
      delStakeForSP = await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)
      assert.isTrue(delStakeForSP.eq(expectedStake), 'Stake not updated')
    })

    it('Fail when undelegating zero stake', async () => {
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let initialDelegateAmount = _lib.audToWeiBN(60)

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
      await _lib.assertRevert(
        delegateManager.requestUndelegateStake(
          stakerAccount,
          0,
          { from: delegatorAccount1 }
        ),
        "Requested undelegate stake amount must be greater than zero"
      )
    })

    // Confirm a pending undelegate operation negates any claimed value
    it('Single delegator + undelegate + claim', async () => {
      // TODO: Validate all
      // Transfer 1000 tokens to delegator
      await token.transfer(delegatorAccount1, INITIAL_BAL, { from: proxyDeployerAddress })

      let initialDelegateAmount = _lib.audToWeiBN(60)

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
      await claimsManager.initiateRound({ from: stakerAccount })
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
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
    it('Single delegator + undelegate + slash', async () => {
      let initialDelegateAmount = _lib.audToWeiBN(60)
      let slashAmountVal = _lib.audToWei(100)
      let slashAmount = _lib.toBN(slashAmountVal)

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
      let preSlashLockupStake = preSlashInfo.lockedUpDelegatorStake
      assert.isTrue(
        preSlashLockupStake.eq(initialDelegateAmount),
        'Initial delegate amount not found')

      // Perform slash functions
      await _lib.slash(slashAmountVal, slasherAccount, governance, delegateManagerKey, guardianAddress)

      let postRewardInfo = await getAccountStakeInfo(stakerAccount, false)

      let postSlashLockupStake = postRewardInfo.lockedUpDelegatorStake
      assert.equal(
        postSlashLockupStake,
        0,
        'Expect no lockup funds to carry over')
    })

    it('Single delegator to invalid SP', async () => {
      let initialDelegateAmount = _lib.audToWeiBN(60)

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

    it('Validate undelegate request restrictions', async () => {
      await _lib.assertRevert(
        delegateManager.cancelUndelegateStakeRequest({ from: delegatorAccount1 }),
        'Pending lockup expected')
      await _lib.assertRevert(
        delegateManager.undelegateStake({ from: delegatorAccount1 }),
        'Pending lockup expected')
      await _lib.assertRevert(
        delegateManager.requestUndelegateStake(stakerAccount, 10, { from: delegatorAccount1 }),
        'Delegator must be staked for SP')

      let initialDelegateAmount = _lib.audToWeiBN(60)
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

      // Try and undelegate more than available
      await _lib.assertRevert(
        delegateManager.requestUndelegateStake(
          stakerAccount,
          initialDelegateAmount.add(_lib.toBN(10)), { from: delegatorAccount1 }),
        'Cannot decrease greater than currently staked for this ServiceProvider'
      )
    })

    it('3 delegators + pending claim + undelegate restrictions', async () => {
      const delegatorAccount2 = accounts[5]
      const delegatorAccount3 = accounts[6]
      // Transfer 1000 tokens to delegator2, delegator3
      await token.transfer(delegatorAccount2, INITIAL_BAL, { from: proxyDeployerAddress })
      await token.transfer(delegatorAccount3, INITIAL_BAL, { from: proxyDeployerAddress })
      let initialDelegateAmount = _lib.audToWeiBN(60)

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
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      let currentBlock = await web3.eth.getBlock('latest')
      let currentBlockNum = currentBlock.number
      assert.isTrue(
        (web3.utils.toBN(currentBlockNum)).gte(undelegateRequestInfo.lockupExpiryBlock),
        'Confirm expired lockup period')

      // Initiate round
      await claimsManager.initiateRound({ from: stakerAccount })

      // Confirm claim is pending
      let pendingClaim = await claimsManager.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimsManager expected to consider claim pending')

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
          { from: delegatorAccount2 }),
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

      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
    })

    it('Undelegate after slash below bounds', async () => {
      let initialDelegateAmount = _lib.audToWeiBN(60)

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

      let preSlashInfo = await getAccountStakeInfo(stakerAccount, false)
      // Set slash amount to all but 1 AUD for this SP
      let diffAmount = _lib.audToWeiBN(1)
      let slashAmount = (preSlashInfo.totalInStakingContract).sub(diffAmount)
      // Perform slash functions
      await _lib.slash(_lib.audToWei(_lib.fromWei(slashAmount)), slasherAccount, governance, delegateManagerKey, guardianAddress)

      // Confirm bounds have been violated for SP
      let spDetails = await getAccountStakeInfo(stakerAccount, false)
      assert.isFalse(
        spDetails.validBounds,
        'Bound violation expected')

      // Determine remaining amount
      let remainingAmount = await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)

      // Submit request to undelegate
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        remainingAmount,
        { from: delegatorAccount1 }
      )

      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        undelegateRequestInfo.amount.eq(remainingAmount),
        'Expect request to match undelegate amount')

      // Advance to valid block
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      let delegatorBalance = await token.balanceOf(delegatorAccount1)

      // Confirm undelegation works despite bound violation
      await delegateManager.undelegateStake({ from: delegatorAccount1 })
      let delegatorBalanceAfterUndelegation = await token.balanceOf(delegatorAccount1)
      // Confirm transfer of token balance
      assert.isTrue((delegatorBalanceAfterUndelegation.sub(remainingAmount)).eq(delegatorBalance))
      // Confirm no balance remaining
      assert.isTrue(
        (await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)).eq(_lib.toBN(0))
      )
    })

    it('Slash below sp bounds', async () => {
      let preSlashInfo = await getAccountStakeInfo(stakerAccount, false)
      // Set slash amount to all but 1 AUD for this SP
      let diffAmount = _lib.audToWeiBN(1)
      let slashAmount = (preSlashInfo.spFactoryStake).sub(diffAmount)

      // Perform slash functions
      await _lib.slash(_lib.audToWei(_lib.fromWei(slashAmount)), slasherAccount, governance, delegateManagerKey, guardianAddress)

      let spDetails = await getAccountStakeInfo(stakerAccount, false)
      assert.isFalse(
        spDetails.validBounds,
        'Bound violation expected')

      // Initiate round
      await claimsManager.initiateRound({ from: stakerAccount })

      await _lib.assertRevert(
        increaseRegisteredProviderStake(
          diffAmount,
          stakerAccount),
        'No claim expected to be pending prior to stake transfer')

      // Confirm claim is pending
      let pendingClaim = await claimsManager.claimPending(stakerAccount)
      assert.isTrue(pendingClaim, 'ClaimsManager expected to consider claim pending')

      // Claim reward even though we are below bounds
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })

      let spDetailsAfterClaim = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (spDetails.totalInStakingContract).eq(spDetailsAfterClaim.totalInStakingContract),
        'Expect NO reward since bounds were violated')

      // Confirm claim is considered NOT pending even though nothing was claimed
      assert.isFalse(
        await claimsManager.claimPending(stakerAccount),
        'ClaimsManager expected to consider claim pending')

      // Confirm bounds are still violated after rewards
      assert.isFalse(
        (await serviceProviderFactory.getServiceProviderDetails(stakerAccount)).validBounds,
        'Bound violation expected')

      // Try to increase by diffAmount, but expect rejection since lower bound is unmet
      await _lib.assertRevert(
        increaseRegisteredProviderStake(
          diffAmount,
          stakerAccount),
        'Minimum stake requirement not met')

      // Increase to minimum
      spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let info = await getAccountStakeInfo(stakerAccount, false)
      let increase = (spDetails.minAccountStake).sub(info.spFactoryStake)
      // Increase to minimum bound
      await increaseRegisteredProviderStake(
        increase,
        stakerAccount)
      // Validate increase
      spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue(
        spDetails.validBounds,
        'Valid bound expected')
    })

    it('Delegator increase/decrease + SP direct stake bound validation', async () => {
      let spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let delegateAmount = spDetails.minAccountStake
      let info = await getAccountStakeInfo(stakerAccount, false)
      let failedIncreaseAmount = spDetails.maxAccountStake
      // Transfer sufficient funds
      await token.transfer(delegatorAccount1, failedIncreaseAmount, { from: proxyDeployerAddress })
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
      await delegateManager.delegateStake(
        stakerAccount,
        delegateAmount,
        { from: delegatorAccount1 })

      // Remove deployer stake
      // Decrease by all but 1 AUD deployer stake
      let spFactoryStake = infoAfterFailure.spFactoryStake
      let diff = _lib.audToWeiBN(1)
      // Confirm failure as min stake threshold is violated
      // Due to the total delegated stake equal to min bounds, total account stake balance will NOT violate bounds
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(spFactoryStake.sub(diff), stakerAccount),
        'Minimum stake requirement not met'
      )

      // Decrease to min
      let spInfo = await getAccountStakeInfo(stakerAccount, false)
      let diffToMin = (spInfo.spFactoryStake).sub(spInfo.minAccountStake)
      await decreaseRegisteredProviderStake(diffToMin, stakerAccount)
      let infoAfterDecrease = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (infoAfterDecrease.spFactoryStake).eq(spInfo.minAccountStake),
        'Expect min direct stake while within total account bounds')

      // At this point we have a total stake of 2x the minimum for this SP
      // 1x Min directly from SP
      // 1x Min from our single delegator
      // So - a service provider should NOT be able to register with no additional stake, since the updated minimum bound for an SP with 2 endpoints is violated
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint3,
          _lib.audToWeiBN(0),
          stakerAccount),
        'Minimum stake requirement not met'
      )

      let infoAfterSecondEndpoint = await getAccountStakeInfo(stakerAccount, false)
      assert.isTrue(
        (infoAfterSecondEndpoint.totalInStakingContract).eq(infoAfterDecrease.totalInStakingContract),
        'Expect static total stake after registration failure'
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
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      let currentBlock = await web3.eth.getBlock('latest')
      let currentBlockNum = currentBlock.number
      assert.isTrue(
        (web3.utils.toBN(currentBlockNum)).gte(undelegateRequestInfo.lockupExpiryBlock),
        'Confirm expired lockup period')

      let delegatorBalance = await token.balanceOf(delegatorAccount1)
      await delegateManager.undelegateStake({ from: delegatorAccount1 })
      let delegatorBalanceAfterUndelegation = await token.balanceOf(delegatorAccount1)
      assert.isTrue((delegatorBalanceAfterUndelegation.sub(delegatorBalance)).eq(delegateAmount), 'Expect funds to be returned')
    })

    it('Undelegate lockup duration changes', async () => {
      let currentDuration = await delegateManager.getUndelegateLockupDuration()
      const newDurationVal = _lib.fromBN(currentDuration) * 2
      const newDuration = _lib.toBN(newDurationVal)

      await _lib.assertRevert(
        delegateManager.updateUndelegateLockupDuration(newDuration),
        "Only callable by Governance contract"
      )

      let updateTx = await governance.guardianExecuteTransaction(
        delegateManagerKey,
        _lib.toBN(0),
        'updateUndelegateLockupDuration(uint256)',
        _lib.abiEncode(['uint256'], [newDurationVal]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        updateTx.tx, DelegateManager, 'UndelegateLockupDurationUpdated',
        { _undelegateLockupDuration: `${newDurationVal}` }
      )

      currentDuration = await delegateManager.getUndelegateLockupDuration()
      assert.isTrue(currentDuration.eq(newDuration))
    })

    it('Maximum delegators', async () => {
      // Update max delegators to 4
      const maxDelegators = 4
      let updateTx = await governance.guardianExecuteTransaction(
        delegateManagerKey,
        _lib.toBN(0),
        'updateMaxDelegators(uint256)',
        _lib.abiEncode(['uint256'], [maxDelegators]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        updateTx.tx, DelegateManager, 'MaxDelegatorsUpdated',
        { _maxDelegators: `${maxDelegators}` }
      )

      assert.equal(
        _lib.fromBN(await delegateManager.getMaxDelegators()),
        maxDelegators,
        'Max delegators not updated'
      )
      let delegateAccountOffset = 4
      let delegatorAccounts = accounts.slice(delegateAccountOffset, delegateAccountOffset + (maxDelegators + 1))
      let singleDelegateAmount = _lib.audToWeiBN(10)
      for (var i = 0; i < delegatorAccounts.length; i++) {
        let delegator = delegatorAccounts[i]
        // Transfer 1000 tokens to each delegator
        await token.transfer(delegator, singleDelegateAmount, { from: proxyDeployerAddress })
        // Approve staking transfer
        await token.approve(stakingAddress, singleDelegateAmount, { from: delegator })
        if (i === (delegatorAccounts.length - 1)) {
          await _lib.assertRevert(
            delegateManager.delegateStake(
              stakerAccount,
              singleDelegateAmount,
              { from: delegator }),
            'Maximum delegators exceeded'
          )
        } else {
          await delegateManager.delegateStake(
            stakerAccount,
            singleDelegateAmount,
            { from: delegator })
        }
      }
    })

    it('Min delegator stake per SP', async () => {
      let minDelegateStakeVal = _lib.audToWei(100)
      await updateMinDelegationAmount(minDelegateStakeVal)

      // Min del stake behavior, confirm min amount is enforced PER service provider
      let minDelegateStake = await delegateManager.getMinDelegationAmount()

      // Approve staking transfer
      await token.approve(
        stakingAddress,
        minDelegateStake,
        { from: delegatorAccount1 })

      // Delegate valid min to SP 1
      await delegateManager.delegateStake(
        stakerAccount,
        minDelegateStake,
        { from: delegatorAccount1 })

      // Delegate invalid min for SP 2
      let invalidMinStake = _lib.toBN(_lib.audToWei(1))
      await token.approve(stakingAddress, invalidMinStake, { from: delegatorAccount1 })
      await _lib.assertRevert(
        delegateManager.delegateStake(
          stakerAccount2,
          invalidMinStake,
          { from: delegatorAccount1 }),
        'Minimum delegation amount'
      )

      // Delegate valid min for SP 2
      await token.approve(
        stakingAddress,
        minDelegateStake,
        { from: delegatorAccount1 })
      await delegateManager.delegateStake(
        stakerAccount2,
        minDelegateStake,
        { from: delegatorAccount1 })
      assert.isTrue((await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)).eq(minDelegateStake), 'Expect min delegate stake')
      assert.isTrue((await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount2)).eq(minDelegateStake), 'Expect min delegate stake')
    })

    it('Min delegate stake verification', async () => {
      // Update min delegation level configuration
      let minDelegateStakeVal = _lib.audToWei(100)
      let minDelegateStake = _lib.toBN(minDelegateStakeVal)
      await updateMinDelegationAmount(minDelegateStakeVal)
      assert.isTrue(
        minDelegateStake.eq(await delegateManager.getMinDelegationAmount()),
        'Min delegation not updated')
      // Approve staking transfer
      await token.approve(
        stakingAddress,
        minDelegateStake,
        { from: delegatorAccount1 })
      // Confirm failure below minimum
      await _lib.assertRevert(
        delegateManager.delegateStake(
          stakerAccount,
          minDelegateStake.sub(_lib.audToWeiBN(10)),
          { from: delegatorAccount1 }),
        'Minimum delegation amount')
      // Delegate min
      await delegateManager.delegateStake(
        stakerAccount,
        minDelegateStake,
        { from: delegatorAccount1 })
      // Submit request to undelegate stake that will fail as total amount results in < min amount
      let failUndelegateAmount = minDelegateStake.sub(_lib.audToWeiBN(30))
      let lockupDuration = await delegateManager.getUndelegateLockupDuration()
      let tx = await delegateManager.requestUndelegateStake(stakerAccount, failUndelegateAmount, { from: delegatorAccount1 })
      let lockupExpiryBlock = _lib.toBN(tx.receipt.blockNumber).add(lockupDuration)
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'UndelegateStakeRequested',
        {
          _delegator: delegatorAccount1,
          _serviceProvider: stakerAccount,
          _amount: failUndelegateAmount,
          _lockupExpiryBlock: lockupExpiryBlock
        }
      )
      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      await _lib.assertRevert(
        delegateManager.undelegateStake({ from: delegatorAccount1 }),
        'Minimum delegation amount'
      )
      // Cancel request
      tx = await delegateManager.cancelUndelegateStakeRequest({ from: delegatorAccount1 })
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'UndelegateStakeRequestCancelled',
        {
          _delegator: delegatorAccount1,
          _serviceProvider: stakerAccount,
          _amount: failUndelegateAmount
        }
      )
      // Undelegate all stake and confirm min delegation amount does not prevent withdrawal
      await delegateManager.requestUndelegateStake(stakerAccount, minDelegateStake, { from: delegatorAccount1 })
      undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      // Finalize undelegation, confirm operation is allowed
      tx = await delegateManager.undelegateStake({ from: delegatorAccount1 })
      assert.equal(_lib.fromBN(await getTotalDelegatorStake(delegatorAccount1)), 0, 'No stake expected')
      assert.equal((await delegateManager.getDelegatorsList(stakerAccount)).length, 0, 'No delegators expected')
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'UndelegateStakeRequestEvaluated',
        {
          _delegator: delegatorAccount1,
          _serviceProvider: stakerAccount,
          _amount: minDelegateStake
        }
      )
    })

    it('Cancel undelegate stake resets state', async () => {
      let spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let delegateAmount = spDetails.minAccountStake
      // Approve staking transfer
      await token.approve(stakingAddress, delegateAmount, { from: delegatorAccount1 })
      await delegateManager.delegateStake(stakerAccount, delegateAmount, { from: delegatorAccount1 })
      // Now, initiate a request to undelegate for this SP
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        delegateAmount,
        { from: delegatorAccount1 }
      )

      let undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      let lockedUpStakeForSp = await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)

      assert.isTrue(
        undelegateRequestInfo.amount.eq(delegateAmount),
        'Expect request to match undelegate amount')
      await delegateManager.cancelUndelegateStakeRequest({ from: delegatorAccount1 })

      let undelegateRequestInfoAfterCancel = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      let lockedUpStakeForSpAfterCancel = await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)

      assert.isTrue(undelegateRequestInfoAfterCancel.target === _lib.addressZero, 'Expect zero address')
      assert.isTrue(undelegateRequestInfoAfterCancel.amount.eq(_lib.toBN(0)), 'Expect 0 pending in undelegate request')
      assert.isTrue(undelegateRequestInfoAfterCancel.lockupExpiryBlock.eq(_lib.toBN(0)), 'Expect 0 pending in undelegate request')
      assert.isTrue(lockedUpStakeForSpAfterCancel.eq(lockedUpStakeForSp.sub(undelegateRequestInfo.amount)), 'Expect decrease in locked up stake for SP')
    })

    it('Caller restriction verification', async () => {
      await _lib.assertRevert(
        delegateManager.updateMaxDelegators(10, { from: accounts[3] }),
        "Only callable by Governance contract"
      )
      await _lib.assertRevert(
        delegateManager.updateMinDelegationAmount(10, { from: accounts[3] }),
        "Only callable by Governance contract"
      )
      await _lib.assertRevert(
        delegateManager.slash(10, slasherAccount),
        "Only callable by Governance contract"
      )
      await _lib.assertRevert(
        delegateManager.updateRemoveDelegatorLockupDuration(10, { from: accounts[3] }),
        "Only callable by Governance contract"
      )
      await _lib.assertRevert(
        delegateManager.updateRemoveDelegatorEvalDuration(10, { from: accounts[3] }),
        "Only callable by Governance contract"
      )
    })

    it('Fail to set service addresses from non-governance contract', async () => {
      await _lib.assertRevert(
        delegateManager.setGovernanceAddress(_lib.addressZero),
        'Only callable by Governance contract'
      )
      await _lib.assertRevert(
        delegateManager.setClaimsManagerAddress(_lib.addressZero),
        'Only callable by Governance contract'
      )
      await _lib.assertRevert(
        delegateManager.setServiceProviderFactoryAddress(_lib.addressZero),
        'Only callable by Governance contract'
      )
      await _lib.assertRevert(
        delegateManager.setStakingAddress(_lib.addressZero),
        'Only callable by Governance contract'
      )
    })

    it('Deregister max stake violation while delegator has an undelegate request pending', async () => {
      let serviceTypeInfo = await serviceTypeManager.getServiceTypeInfo(testDiscProvType)
      // Register 2nd endpoint from SP1, with minimum additional stake
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint3,
        serviceTypeInfo.minStake,
        stakerAccount)

      let ids = await serviceProviderFactory.getServiceProviderIdsFromAddress(stakerAccount, testDiscProvType)
      assert.isTrue(ids.length === 2, 'Expect 2 registered endpoints')

      // Lower to minimum total stake for this SP
      let spInfo = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let decreaseStakeAmount = (spInfo.deployerStake).sub(spInfo.minAccountStake)
      await serviceProviderFactory.requestDecreaseStake(decreaseStakeAmount, { from: stakerAccount })
      let deregisterRequestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
      await time.advanceBlockTo(deregisterRequestInfo.lockupExpiryBlock)
      await serviceProviderFactory.decreaseStake({ from: stakerAccount })
      spInfo = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue(spInfo.deployerStake.eq(spInfo.minAccountStake), 'Expect min stake for deployer')

      // Delegate up to max stake for SP1 with 2 endpoints
      let delegationAmount = spInfo.maxAccountStake.sub(spInfo.deployerStake)
      // Transfer tokens to delegator
      await token.transfer(delegatorAccount1, delegationAmount, { from: proxyDeployerAddress })
      await token.approve(
        stakingAddress,
        delegationAmount,
        { from: delegatorAccount1 })
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount1 })
      spInfo = await getAccountStakeInfo(stakerAccount)
      assert.isTrue(spInfo.maxAccountStake.eq(spInfo.totalActiveStake), 'Expect max to be reached after delegation')

      // Attempt to deregister an endpoint
      // Failure expected as max bound will be violated upon deregister
      await _lib.assertRevert(
        _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          stakerAccount),
        'Maximum stake amount exceeded'
      )

      let delegatorTokenBalance = await token.balanceOf(delegatorAccount1)
      // Request undelegate stake from the delegator account
      await delegateManager.requestUndelegateStake(stakerAccount, delegationAmount, { from: delegatorAccount1 })
      let pendingUndelegateRequest = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(
        (pendingUndelegateRequest.target === stakerAccount) &&
        (pendingUndelegateRequest.amount.eq(delegationAmount)) &&
        !(pendingUndelegateRequest.lockupExpiryBlock.eq(_lib.toBN(0))),
        'Expect pending request'
      )

      // Fail to call removeDelegator from not a SP or governance
      await _lib.assertRevert(
        delegateManager.removeDelegator(stakerAccount, delegatorAccount1, { from: delegatorAccount1 }),
        "Only callable by target SP or governance"
      )
      
      // Confirm failure without a pending request
      await _lib.assertRevert(
        delegateManager.removeDelegator(stakerAccount, delegatorAccount1, { from: stakerAccount }),
        "No pending request"
      )

      // Remove delegator
      await delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount1, { from: stakerAccount })

      let requestTargetBlock = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount1)

      // Move to valid block and actually perform remove
      await time.advanceBlockTo(requestTargetBlock)
      await delegateManager.removeDelegator(stakerAccount, delegatorAccount1, { from: stakerAccount })

      let stakeAfterRemoval = await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)
      let delegatorsList = await delegateManager.getDelegatorsList(stakerAccount)
      pendingUndelegateRequest = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      assert.isTrue(stakeAfterRemoval.eq(_lib.toBN(0)), 'Expect 0 delegated stake')
      assert.isTrue(delegatorsList.length === 0, 'No delegators expected')

      let delegatorTokenBalance2 = await token.balanceOf(delegatorAccount1)
      let diff = delegatorTokenBalance2.sub(delegatorTokenBalance)
      assert.isTrue(diff.eq(delegationAmount), 'Expect full delegation amount to be refunded')

      assert.isTrue(
        (pendingUndelegateRequest.target === _lib.addressZero) &&
        (pendingUndelegateRequest.amount.eq(_lib.toBN(0))) &&
        (pendingUndelegateRequest.lockupExpiryBlock.eq(_lib.toBN(0))),
        'Expect pending request cancellation'
      )

      // Cache current spID
      let spID = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint)
      let info = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spID)
      assert.isTrue(
        info.owner === stakerAccount &&
        info.delegateOwnerWallet === stakerAccount &&
        info.endpoint === testEndpoint,
        'Expect sp state removal'
      )
      // Again try to deregister
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        stakerAccount)

      // Confirm endpoint has no ID associated
      let spID2 = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint)
      assert.isTrue(spID2.eq(_lib.toBN(0)), 'Expect reset of endpoint')
      // Confirm removal of all sp state
      info = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spID)
      assert.isTrue(
        info.owner === (_lib.addressZero) &&
        info.delegateOwnerWallet === (_lib.addressZero) &&
        info.endpoint === '' &&
        info.blockNumber.eq(_lib.toBN(0)),
        'Expect sp state removal'
      )
    })

    // Validate behavior around removeDelegator
    //       - expiry block calculated correctly (done)
    //       - cancelRemoveDelegatorRequest behavior resets request (done)
    //       - evaluation window enforced (done) 
    //       - invalid delegator for this sp during call to removeDelegator (done)
    //       - Pending request before call to requestRemoveDelegator
    it('removeDelegator validation', async () => {
      const delegationAmount = _lib.toBN(100)
      const delegatorAccount2 = accounts[5]
      // Transfer tokens to delegator
      await token.transfer(delegatorAccount1, delegationAmount, { from: proxyDeployerAddress })
      await token.transfer(delegatorAccount2, delegationAmount, { from: proxyDeployerAddress })
      await token.approve(stakingAddress, delegationAmount, { from: delegatorAccount1 })
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount1 })

      let delegatorTokenBalance = await token.balanceOf(delegatorAccount1)

      // fail to removeDelegator from not a SP or governance
      await _lib.assertRevert(
        delegateManager.removeDelegator(stakerAccount, delegatorAccount1, { from: delegatorAccount1 }),
        "Only callable by target SP or governance"
      )

      let removeReqDuration = await delegateManager.getRemoveDelegatorLockupDuration()
      let removeReqEvalDuration = await delegateManager.getRemoveDelegatorEvalDuration()

      // Remove delegator
      let tx = await delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount1, { from: stakerAccount })
      let lockupExpiryBlock = _lib.toBN(tx.receipt.blockNumber).add(removeReqDuration)
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'RemoveDelegatorRequested',
        { _serviceProvider: stakerAccount, _delegator: delegatorAccount1, _lockupExpiryBlock: lockupExpiryBlock }
      )
      let blocknumber = _lib.toBN(tx.receipt.blockNumber)
      let expectedTarget = blocknumber.add(removeReqDuration)

      let requestTargetBlock = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount1)
      assert.isTrue(requestTargetBlock.eq(expectedTarget), 'Target unexpected')

      // Move to valid block and actually perform remove
      await time.advanceBlockTo(requestTargetBlock)
      tx = await delegateManager.removeDelegator(stakerAccount, delegatorAccount1, { from: stakerAccount })
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'RemoveDelegatorRequestEvaluated',
        { _serviceProvider: stakerAccount, _delegator: delegatorAccount1, _unstakedAmount: delegationAmount }
      )

      requestTargetBlock = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount1)
      assert.isTrue(requestTargetBlock.eq(_lib.toBN(0)), 'Reset expected')

      // Forcibly remove the delegator from service provider account
      let stakeAfterRemoval = await delegateManager.getDelegatorStakeForServiceProvider(delegatorAccount1, stakerAccount)
      let delegatorsList = await delegateManager.getDelegatorsList(stakerAccount)
      assert.isTrue(stakeAfterRemoval.eq(_lib.toBN(0)), 'Expect 0 delegated stake')
      assert.isTrue(delegatorsList.length === 0, 'No delegators expected')

      let delegatorTokenBalance2 = await token.balanceOf(delegatorAccount1)
      let diff = delegatorTokenBalance2.sub(delegatorTokenBalance)
      assert.isTrue(diff.eq(delegationAmount), 'Expect full delegation amount to be refunded')

      // Try to remove a delegator that does not yet exist, confirm failure
      await _lib.assertRevert(
        delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount2, { from: stakerAccount }),
        'Delegator must be staked for SP'
      )

      // Delegate from a new account
      await token.approve(
        stakingAddress,
        delegationAmount,
        { from: delegatorAccount2 })
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount2 })

      // Request removal
      tx = await delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount2, { from: stakerAccount })
      blocknumber = _lib.toBN(tx.receipt.blockNumber)
      expectedTarget = blocknumber.add(removeReqDuration)

      requestTargetBlock = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount2)
      assert.isTrue(requestTargetBlock.eq(expectedTarget), 'Target block unexpected')

      // Call from wrong account
      await _lib.assertRevert(
        delegateManager.cancelRemoveDelegatorRequest(stakerAccount, delegatorAccount2),
        'Only callable by target SP'
      )

      // Cancel and validate request
      tx = await delegateManager.cancelRemoveDelegatorRequest(stakerAccount, delegatorAccount2, { from: stakerAccount })
      await expectEvent.inTransaction(
        tx.tx,
        DelegateManager,
        'RemoveDelegatorRequestCancelled',
        { _serviceProvider: stakerAccount, _delegator: delegatorAccount2 }
      )
      let requestTargetBlockAfterCancel = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount2)
      assert.isTrue(requestTargetBlockAfterCancel.eq(_lib.toBN(0)), 'Expect reset')

      // Reissue request
      await delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount2, { from: stakerAccount })
      requestTargetBlock = await delegateManager.getPendingRemoveDelegatorRequest(stakerAccount, delegatorAccount2)
      let evalBlock = requestTargetBlock.add(removeReqEvalDuration)

      // Progress to the evaluation block
      await time.advanceBlockTo(evalBlock)

      // Confirm rejection after window
      await _lib.assertRevert(
        delegateManager.removeDelegator(stakerAccount, delegatorAccount2, { from: stakerAccount }),
        'RemoveDelegator evaluation window expired'
       )

      // Retry should fail here as the request has not been cancelled yet, but the window has expired
      await _lib.assertRevert(
        delegateManager.requestRemoveDelegator(stakerAccount, delegatorAccount2, { from: stakerAccount }),
        'Pending remove delegator request'
      )
    })

    describe('Service provider decrease stake behavior', async () => {
      it('claimReward disabled if no active stake for SP', async () => {
        // Request decrease all of stake through deregister
        await _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          stakerAccount)
        // Initiate round
        await claimsManager.initiateRound({ from: stakerAccount })
        let acctInfo = await getAccountStakeInfo(stakerAccount)
        let spStake = acctInfo.spFactoryStake
        assert.isTrue(spStake.gt(_lib.toBN(0)), 'Expect non-zero stake')
        let preClaimInfo = await getAccountStakeInfo(stakerAccount)
        // Transaction will fail since maximum stake for the account is now zero after the deregister
        await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
        let postClaimInfo = await getAccountStakeInfo(stakerAccount)
        assert.isTrue(
          postClaimInfo.totalInStakingContract.eq(preClaimInfo.totalInStakingContract),
          "Expect no reward for an account claiming"
        )
        let deregisterRequestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
        await time.advanceBlockTo(deregisterRequestInfo.lockupExpiryBlock)
        // Withdraw all stake
        await serviceProviderFactory.decreaseStake({ from: stakerAccount })
        // Attempt to re-register endpoint
        // Confirm re-registration is allowed
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount
        )
        acctInfo = await getAccountStakeInfo(stakerAccount)
        assert.isTrue(acctInfo.totalInStakingContract.eq(DEFAULT_AMOUNT), 'Expect default in staking')
        assert.isTrue(acctInfo.spFactoryStake.eq(DEFAULT_AMOUNT), 'Expect default in sp factory')
      })

      it('Re-registration after removing all stake and claim', async () => {
        // Initiate round
        await claimsManager.initiateRound({ from: stakerAccount })
        // Claim reward immediately
        await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
        // Request decrease all of stake
        await _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          stakerAccount)
        let deregisterRequestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
        await time.advanceBlockTo(deregisterRequestInfo.lockupExpiryBlock)
        assert.isFalse(await claimsManager.claimPending(stakerAccount), 'Expect no claim pending')
        // Withdraw all stake
        await serviceProviderFactory.decreaseStake({ from: stakerAccount })
        let acctInfo = await getAccountStakeInfo(stakerAccount)
        assert.isTrue(acctInfo.totalInStakingContract.eq(_lib.toBN(0)), 'Expect default in staking')
        assert.isTrue(acctInfo.spFactoryStake.eq(_lib.toBN(0)), 'Expect default in sp factory')
        assert.isTrue(acctInfo.numberOfEndpoints.eq(_lib.toBN(0)), 'Expect no endpoints in sp factory')

        // Initiate round
        await claimsManager.initiateRound({ from: stakerAccount2 })
        // Expect no claim pending even though lastClaimed for this SP is < the round initiated
        // Achieved by number of endpoints check in ClaimsManager
        assert.isFalse(await claimsManager.claimPending(stakerAccount), 'Expect no claim pending')
        // Attempt to re-register endpoint
        // Confirm re-registration is allowed
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount
        )
        acctInfo = await getAccountStakeInfo(stakerAccount)
        assert.isTrue(acctInfo.totalInStakingContract.eq(DEFAULT_AMOUNT), 'Expect default in staking')
        assert.isTrue(acctInfo.spFactoryStake.eq(DEFAULT_AMOUNT), 'Expect default in sp factory')
      })

      it('Balance tracking inconsistency', async () => {
        const staker3Amt = _lib.toBN('384823535956494802781028')
        const staker4Amt = _lib.toBN('462563700468205107730431')
        const staker5Amt = _lib.toBN('221500000000000000000000')
        const staker6Amt = _lib.toBN('201000000000000000000000')
        await token.transfer(stakerAccount3, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount4, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount5, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount6, INITIAL_BAL, { from: proxyDeployerAddress })
        let totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint2,
          staker3Amt,
          stakerAccount3
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint3,
          staker4Amt,
          stakerAccount4
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint4,
          staker5Amt,
          stakerAccount5
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint5,
          staker6Amt,
          stakerAccount6
        )
 
        // Approve staking transfer from account 1
        let delegateAmount = _lib.toBN('368189417720410270532')
        await token.approve(
          stakingAddress,
          delegateAmount,
          { from: stakerAccount2 })
  
        // Delegate to staker2 from staker1 
        await delegateManager.delegateStake(
          stakerAccount,
          delegateAmount,
          { from: stakerAccount2 })
  
        // Delegate from 6 to 2 
        await token.approve(
          stakingAddress,
          delegateAmount,
          { from: stakerAccount6 })
  
        // Delegate to staker2 from staker1 
        await delegateManager.delegateStake(
          stakerAccount2,
          delegateAmount,
          { from: stakerAccount6 })

        totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
        let totalStakedForStaker2 = await staking.totalStakedFor(stakerAccount2) 
        let sp2Stake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount2)).deployerStake
        let sp2DelegatedStake = await delegateManager.getTotalDelegatedToServiceProvider(stakerAccount2)
        let totalStakedForStaker3 = await staking.totalStakedFor(stakerAccount3) 
        let totalStakedForStaker4 = await staking.totalStakedFor(stakerAccount4) 
        let totalStakedForStaker5 = await staking.totalStakedFor(stakerAccount5) 
    
        await claimsManager.initiateRound({ from: stakerAccount })

        let tx = await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
        tx = await delegateManager.claimRewards(stakerAccount2, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount3, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount4, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount5, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount6, { from: stakerAccount2 })
  
        totalStakedForStaker2 = await staking.totalStakedFor(stakerAccount2) 
        sp2Stake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount2)).deployerStake
        sp2DelegatedStake = await delegateManager.getTotalDelegatedToServiceProvider(stakerAccount2)

        totalStakedForStaker3 = await staking.totalStakedFor(stakerAccount3) 
        totalStakedForStaker4 = await staking.totalStakedFor(stakerAccount4) 
        totalStakedForStaker5 = await staking.totalStakedFor(stakerAccount5) 
  
        let fundBlock = await claimsManager.getLastFundedBlock()
        let blockDiff = await claimsManager.getFundingRoundBlockDiff()
        let roundEndBlock = fundBlock.add(blockDiff.add(_lib.toBN(10)))
        await time.advanceBlockTo(roundEndBlock)
  
        await claimsManager.initiateRound({ from: stakerAccount })

        tx = await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
        tx = await delegateManager.claimRewards(stakerAccount2, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount3, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount4, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount5, { from: stakerAccount2 })
        tx = await delegateManager.claimRewards(stakerAccount6, { from: stakerAccount2 })

        totalStakedForAccount = await staking.totalStakedFor(stakerAccount)
  
        totalStakedForStaker2 = await staking.totalStakedFor(stakerAccount2)
        sp2Stake = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount2)).deployerStake
        sp2DelegatedStake = await delegateManager.getTotalDelegatedToServiceProvider(stakerAccount2)
  
        totalStakedForStaker3 = await staking.totalStakedFor(stakerAccount3) 
        totalStakedForStaker4 = await staking.totalStakedFor(stakerAccount4) 
        totalStakedForStaker5 = await staking.totalStakedFor(stakerAccount5) 

        await validateAccountStakeBalance(stakerAccount)
        await validateAccountStakeBalance(stakerAccount2)
        await validateAccountStakeBalance(stakerAccount3)
        await validateAccountStakeBalance(stakerAccount4)
        await validateAccountStakeBalance(stakerAccount5)
        await validateAccountStakeBalance(stakerAccount6)
      })

      it('Slashing inconsistency', async () => {
        const staker3Amt = _lib.toBN('384823535956494802781028')
        const staker4Amt = _lib.toBN('462563700468205107730431')
        const staker5Amt = _lib.toBN('221500000000000000000000')
        const staker6Amt = _lib.toBN('201000000000000000000000')
        await token.transfer(stakerAccount3, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount4, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount5, INITIAL_BAL, { from: proxyDeployerAddress })
        await token.transfer(stakerAccount6, INITIAL_BAL, { from: proxyDeployerAddress })
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint2,
          staker3Amt,
          stakerAccount3
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint3,
          staker4Amt,
          stakerAccount4
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint4,
          staker5Amt,
          stakerAccount5
        )
        await _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint5,
          staker6Amt,
          stakerAccount6
        )
        // Approve staking transfer from account 1
        let delegateAmount = _lib.toBN('368189417720410270532')
        await token.approve(
          stakingAddress,
          delegateAmount,
          { from: stakerAccount2 })
        // Delegate to staker2 from staker1 
        await delegateManager.delegateStake(
          stakerAccount3,
          delegateAmount,
          { from: stakerAccount2 })
        let totalBalanceInSPFactoryPreSlash = (await serviceProviderFactory.getServiceProviderDetails(stakerAccount3)).deployerStake
        let sp3DelegatedStakePreSlash = await delegateManager.getTotalDelegatedToServiceProvider(stakerAccount3)
        let totalBalanceInStakingPreSlash = await staking.totalStakedFor(stakerAccount3) 
        // Perform slash
        let slashAmountStr = '184823535956735802285029'
        await _lib.slash(slashAmountStr, stakerAccount3, governance, delegateManagerKey, guardianAddress)
        let totalBalanceInStakingAfterSlash = await staking.totalStakedFor(stakerAccount3) 
        let sp3NewDelegateStake = (totalBalanceInStakingAfterSlash.mul(sp3DelegatedStakePreSlash)).div(totalBalanceInStakingPreSlash)
        let totalDelegatedStakeDecrease = sp3DelegatedStakePreSlash.sub(sp3NewDelegateStake)
        let totalStakeDecrease = totalBalanceInStakingPreSlash.sub(totalBalanceInStakingAfterSlash)
        let totalSPFactoryBalanceDecrease = totalStakeDecrease.sub(totalDelegatedStakeDecrease)
        let expectedSp3DeployerStake = totalBalanceInSPFactoryPreSlash.sub(totalSPFactoryBalanceDecrease)
        // Validate all accounts
        await validateAccountStakeBalance(stakerAccount)
        await validateAccountStakeBalance(stakerAccount2)
        let sp3Info = await validateAccountStakeBalance(stakerAccount3)
        await validateAccountStakeBalance(stakerAccount4)
        await validateAccountStakeBalance(stakerAccount5)
        await validateAccountStakeBalance(stakerAccount6)
        assert.isTrue(
          expectedSp3DeployerStake.eq(sp3Info.spFactoryStake),
          `Expected ${expectedSp3DeployerStake}, found ${sp3Info.spFactoryStake}`
        )
      })

      it('Decrease in reward for pending stake decrease', async () => {
        // At the start of this test, we have 2 SPs each with DEFAULT_AMOUNT staked
        let fundsPerRound = await claimsManager.getFundsPerRound()
        let expectedIncrease = fundsPerRound.div(_lib.toBN(4))
        // Request decrease in stake corresponding to 1/2 of DEFAULT_AMOUNT
        let decreaseStakeAmount = DEFAULT_AMOUNT.div(_lib.toBN(2))
        await serviceProviderFactory.requestDecreaseStake(decreaseStakeAmount, { from: stakerAccount })
        let info = await getAccountStakeInfo(stakerAccount)
        await claimsManager.initiateRound({ from: stakerAccount })
        await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })
        let info2 = await getAccountStakeInfo(stakerAccount)
        let stakingDiff = (info2.totalInStakingContract).sub(info.totalInStakingContract)
        let spFactoryDiff = (info2.spFactoryStake).sub(info.spFactoryStake)
        assert.isTrue(stakingDiff.eq(expectedIncrease), 'Expected increase not found in Staking.sol')
        assert.isTrue(spFactoryDiff.eq(expectedIncrease), 'Expected increase not found in SPFactory')
      })

      it('Slash cancels pending undelegate request', async () => {
        // Lock 1/2 stake
        await serviceProviderFactory.requestDecreaseStake(DEFAULT_AMOUNT.div(_lib.toBN(2)), { from: stakerAccount })
        let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
        assert.isTrue((requestInfo.lockupExpiryBlock).gt(_lib.toBN(0)), 'Expected lockup expiry block to be set')
        assert.isTrue((requestInfo.amount).gt(_lib.toBN(0)), 'Expected amount to be set')

        // Initiate a round
        await claimsManager.initiateRound({ from: accounts[10] })

        // Slash all stake while pending request
        await _lib.slash(DEFAULT_AMOUNT.toString(), slasherAccount, governance, delegateManagerKey, guardianAddress)

        // Validate pending decrease stake request status on chain
        requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
        assert.isTrue((requestInfo.lockupExpiryBlock).eq(_lib.toBN(0)), 'Expected lockup expiry block reset')
        assert.isTrue((requestInfo.amount).eq(_lib.toBN(0)), 'Expected amount reset')

        // Confirm successful claim of zero after getting slashed 
        let claimTx = await delegateManager.claimRewards(stakerAccount)
        await expectEvent.inTransaction(
          claimTx.tx,
          DelegateManager,
          'Claim',
          {
            _claimer: stakerAccount,
            _rewards: _lib.toBN(0)
          }
        )
        let info = await getAccountStakeInfo(stakerAccount)
        assert.isTrue(info.spFactoryStake.eq(_lib.toBN(0)), 'No stake expected')
        assert.isTrue(info.totalInStakingContract.eq(_lib.toBN(0)), 'No stake expected')
      })

      it('Update decreaseStakeLockupDuration', async () => {
        let duration = await serviceProviderFactory.getDecreaseStakeLockupDuration()
        assert.equal(_lib.fromBN(duration), DECREASE_STAKE_LOCKUP_DURATION, 'Expected same decreaseStakeLockupDuration')

        // Double decrease stake duration
        let newDuration = duration.add(duration)

        await _lib.assertRevert(
          serviceProviderFactory.updateDecreaseStakeLockupDuration(newDuration),
          "Only callable by Governance contract"
        )

        let updateDecreaseStakeDurationTx = await governance.guardianExecuteTransaction(
          serviceProviderFactoryKey,
          _lib.toBN(0),
          'updateDecreaseStakeLockupDuration(uint256)',
          _lib.abiEncode(['uint256'], [_lib.fromBN(newDuration)]),
          { from: guardianAddress }
        )
        await expectEvent.inTransaction(
          updateDecreaseStakeDurationTx.tx, ServiceProviderFactory, 'DecreaseStakeLockupDurationUpdated',
          { _lockupDuration: newDuration }
        )

        let updatedDuration = await serviceProviderFactory.getDecreaseStakeLockupDuration()
        assert.isTrue(updatedDuration.eq(newDuration), 'Update not reflected')

        let tx = await serviceProviderFactory.requestDecreaseStake(DEFAULT_AMOUNT.div(_lib.toBN(2)), { from: stakerAccount })
        let blocknumber = _lib.toBN(tx.receipt.blockNumber)
        let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount)
        assert.isTrue(
          (blocknumber.add(updatedDuration)).eq(requestInfo.lockupExpiryBlock),
          'Unexpected blocknumber'
        )
      })
    })

    it('Delegate ops after serviceType removal', async () => {
      /**
       * Confirm initial state of serviceType and serviceProvider
       * Delegate stake to Staker
       * Remove serviceType
       * Confirm new state of serviceType and serviceProvider
       * Confirm delegation to SP still works
       * Deregister SP of serviceType
       * Undelegate stake from Staker
       * Confirm new delegation state
       */

      const minStakeBN = _lib.toBN(serviceTypeMinStake)
      const maxStakeBN = _lib.toBN(serviceTypeMaxStake)

      // Confirm initial serviceType info
      const stakeInfo0 = await serviceTypeManager.getServiceTypeInfo.call(testDiscProvType)
      assert.isTrue(stakeInfo0.isValid, 'Expected isValid == true')
      assert.isTrue(stakeInfo0.minStake.eq(minStakeBN), 'Expected same minStake')
      assert.isTrue(stakeInfo0.maxStake.eq(maxStakeBN), 'Expected same maxStake')

      // Confirm initial SP details
      const spDetails0 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      assert.isTrue(spDetails0.deployerStake.eq(DEFAULT_AMOUNT), 'Expected deployerStake == default amount')
      assert.isTrue(spDetails0.validBounds, 'Expected validBounds == true')
      assert.isTrue(spDetails0.numberOfEndpoints.eq(_lib.toBN(1)), 'Expected one endpoint')
      assert.isTrue(spDetails0.minAccountStake.eq(minStakeBN), 'Expected minAccountStake == dpTypeMin')
      assert.isTrue(spDetails0.maxAccountStake.eq(maxStakeBN), 'Expected maxAccountStake == dpTypeMax')

      // Delegate stake to Staker
      const delegationAmount = _lib.audToWeiBN(60)
      await token.approve(
        stakingAddress,
        delegationAmount,
        { from: delegatorAccount1 }
      )
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount1 }
      )

      // Remove serviceType
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue0,
        'removeServiceType(bytes32)',
        _lib.abiEncode(['bytes32'], [testDiscProvType]),
        { from: guardianAddress }
      )

      // Confirm serviceType info is changed after serviceType removal
      const stakeInfo1 = await serviceTypeManager.getServiceTypeInfo.call(testDiscProvType)
      assert.isFalse(stakeInfo1.isValid, 'Expected isValid == false')
      assert.isTrue(stakeInfo1.minStake.eq(minStakeBN), 'Expected same minStake')
      assert.isTrue(stakeInfo1.maxStake.eq(maxStakeBN), 'Expected same maxStake')

      // Confirm SP details are unchanged after serviceType removal
      const spDetails = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      assert.isTrue(spDetails.deployerStake.eq(DEFAULT_AMOUNT), 'Expected deployerStake == default amount')
      assert.isTrue(spDetails.validBounds, 'Expected validBounds == true')
      assert.isTrue(spDetails.numberOfEndpoints.eq(_lib.toBN(1)), 'Expected one endpoint')
      assert.isTrue(spDetails.minAccountStake.eq(minStakeBN), 'Expected minAccountStake == dpTypeMin')
      assert.isTrue(spDetails.maxAccountStake.eq(maxStakeBN), 'Expected maxAccountStake == dpTypeMax')

      // Confirm delegation to SP still works after serviceType removal
      await token.approve(
        stakingAddress,
        delegationAmount,
        { from: delegatorAccount1 }
      )
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount1 }
      )
      const totalDelegationAmount = delegationAmount.add(delegationAmount)

      // Deregister SP + unstake
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        stakerAccount
      )
      const deregisterRequestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest.call(stakerAccount)
      await time.advanceBlockTo(deregisterRequestInfo.lockupExpiryBlock)
      await serviceProviderFactory.decreaseStake({ from: stakerAccount })

      // Undelegate total amount
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        totalDelegationAmount,
        { from: delegatorAccount1 }
      )
      const undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      await delegateManager.undelegateStake({ from: delegatorAccount1 })

      // Confirm delegation state
      const totalStakedForSP = await staking.totalStakedFor(stakerAccount)
      assert.isTrue(totalStakedForSP.isZero(), 'Expected totalStaked for SP == 0')
      const delegators = await delegateManager.getDelegatorsList(stakerAccount)
      assert.equal(delegators.length, 0, 'Expect delegators list length == 0')
      const delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      assert.isTrue(delegatedStake.isZero(), 'Expected delegatedStake == 0')
      const totalLockedDelegationForSP = await delegateManager.getTotalLockedDelegationForServiceProvider(stakerAccount)
      assert.isTrue(totalLockedDelegationForSP.isZero(), 'Expected totalLockedDelegationForSP == 0')
    })

    it('fail to set Governance address if not a valid governance contract', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          delegateManagerKey,
          _lib.toBN(0),
          'setGovernanceAddress(address)',
          _lib.abiEncode(['address'], [accounts[13]]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )
    })

    it('lets a service provider return to valid bounds when a delegator changes delegation', async () => {
      /**
       * Test case to address behavior exercised in Postmortem: $AUDIO Claim Error (Claim of 0 $AUDIO)
       * on 05-08-2021.
       *
       * Confirm initial state of serviceType and serviceProvider
       * Delegate stake to Staker
       * Verify that the Staker is within bounds (validBounds = true)
       * Claim to send the Staker out of bounds
       * Verify that the Staker has exceeded bounds (validBounds = false)
       * Decrease delegated stake to Staker
       * Verify that the Staker has returned to be within bounds (validBounds = true)
       */
      const minStakeBN = _lib.toBN(serviceTypeMinStake)
      const maxStakeBN = _lib.toBN(serviceTypeMaxStake)

      // Confirm initial serviceType info
      const stakeInfo0 = await serviceTypeManager.getServiceTypeInfo.call(testDiscProvType)
      assert.isTrue(stakeInfo0.isValid, 'Expected isValid == true')
      assert.isTrue(stakeInfo0.minStake.eq(minStakeBN), 'Expected same minStake')
      assert.isTrue(stakeInfo0.maxStake.eq(maxStakeBN), 'Expected same maxStake')

      // Confirm initial SP details
      const spDetails0 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      const totalStaked0 = await staking.totalStakedFor(stakerAccount)
      console.log(totalStaked0.toString())
      console.log(spDetails0.deployerStake.toString())
      console.log(spDetails0.minAccountStake.toString())
      console.log(spDetails0.maxAccountStake.toString())
      console.log('\n')

      assert.isTrue(totalStaked0.eq(DEFAULT_AMOUNT), 'Expected totalStake == default amount')
      assert.isTrue(spDetails0.deployerStake.eq(DEFAULT_AMOUNT), 'Expected deployerStake == default amount')
      assert.isTrue(spDetails0.validBounds, 'Expected validBounds == true')
      assert.isTrue(totalStaked0.gt(spDetails0.minAccountStake), 'Expected totalStake > minAccountStake')
      assert.isTrue(totalStaked0.lt(spDetails0.maxAccountStake), 'Expected totalStake < maxAccountStake')

      // Delegate stake to Staker, pushing them to the upper maxAmount bound
      const delegationAmount = _lib.audToWeiBN(9999880)
      await token.approve(
        stakingAddress,
        delegationAmount,
        { from: delegatorAccount1 }
      )
      await delegateManager.delegateStake(
        stakerAccount,
        delegationAmount,
        { from: delegatorAccount1 }
      )

      const spDetails1 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      const totalStaked1 = await staking.totalStakedFor(stakerAccount)
      console.log(totalStaked1.toString())
      console.log(spDetails1.deployerStake.toString())
      console.log(spDetails1.minAccountStake.toString())
      console.log(spDetails1.maxAccountStake.toString())
      console.log('\n')

      assert.isTrue(totalStaked1.eq(
        DEFAULT_AMOUNT.add(delegationAmount)
      ), 'Expected totalStake == default amount + delegated amount')
      assert.isTrue(spDetails1.deployerStake.eq(DEFAULT_AMOUNT), 'Expected deployerStake == default amount')
      assert.isTrue(spDetails1.validBounds, 'Expected validBounds == true')
      assert.isTrue(totalStaked1.eq(spDetails1.maxAccountStake), 'Expected totalStake == maxAccountStake')

      // Initiate a claim round which will send the Staker over bounds
      await claimsManager.initiateRound({ from: stakerAccount })
      await delegateManager.claimRewards(stakerAccount, { from: stakerAccount })

      const spDetails2 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      const totalStaked2 = await staking.totalStakedFor(stakerAccount)
      assert.isFalse(spDetails2.validBounds, 'Expected validBounds == false')
      assert.isTrue(totalStaked2.gt(spDetails2.maxAccountStake), 'Expected totalStake > maxAccountStake')

      // Undelegate to return the staker back in bounds
      const delegatedStake = await getTotalDelegatorStake(delegatorAccount1)
      await delegateManager.requestUndelegateStake(
        stakerAccount,
        delegatedStake,
        { from: delegatorAccount1 }
      )
      const undelegateRequestInfo = await delegateManager.getPendingUndelegateRequest(delegatorAccount1)
      await time.advanceBlockTo(undelegateRequestInfo.lockupExpiryBlock)
      await delegateManager.undelegateStake({ from: delegatorAccount1 })

      const spDetails3 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      const totalStaked3 = await staking.totalStakedFor(stakerAccount)

      // Ensure that we are above min stake and below max stake
      assert.isTrue(totalStaked3.gt(spDetails1.minAccountStake), 'Expected totalStake > minAccountStake')
      assert.isTrue(totalStaked3.lt(spDetails1.maxAccountStake), 'Expected totalStake < maxAccountStake')

      // Without a contract change this fails as the DelegateManager does not update validBounds
      assert.isTrue(spDetails3.validBounds, 'Expected validBounds == true')
    })
  })
})
