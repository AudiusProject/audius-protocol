import * as _lib from '../utils/lib.js'
const { time, expectEvent } = require('@openzeppelin/test-helpers')

const MockDelegateManager = artifacts.require('MockDelegateManager')
const MockStakingCaller = artifacts.require('MockStakingCaller')
const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ClaimsManager = artifacts.require('ClaimsManager')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)
const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10

const callValue0 = _lib.toBN(0)


contract('ClaimsManager', async (accounts) => {
  let token, registry, governance, staking0, stakingProxy, staking, claimsManager0, claimsManagerProxy, claimsManager
  let mockDelegateManager, mockStakingCaller

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress, staker, newUpdateAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

  const approveTransferAndStake = async (amount, staker) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: proxyDeployerAddress })
    // Allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // Stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      amount)
  }

  beforeEach(async () => {
    // Deploy registry
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register governance
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

    // Deploy and register staking
    staking0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      governance.address,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: proxyDeployerAddress })
    staking = await Staking.at(stakingProxy.address)

    // Mock SP for test
    mockStakingCaller = await MockStakingCaller.new()
    await mockStakingCaller.initialize(stakingProxy.address, token.address)
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address, { from: proxyDeployerAddress })

    // Deploy claimsManagerProxy
    claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      governance.address,
      claimsInitializeCallData,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)

    // Register claimsManagerProxy
    await registry.addContract(claimsManagerProxyKey, claimsManagerProxy.address, { from: proxyDeployerAddress })

    // Deploy mock delegate manager with only function to forward processClaim call
    mockDelegateManager = await MockDelegateManager.new()
    await mockDelegateManager.initialize(claimsManagerProxy.address)
    await registry.addContract(delegateManagerKey, mockDelegateManager.address, { from: proxyDeployerAddress })

    // Register new contract as a minter, from the same address that deployed the contract
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [claimsManager.address]),
      { from: guardianAddress }
    )

    // ---- Configuring addresses
    await _lib.configureGovernanceStakingAddress(
      governance,
      governanceKey,
      guardianAddress,
      stakingProxy.address
    )
    // ---- Set up staking contract permissions
    await _lib.configureStakingContractAddresses(
      governance,
      guardianAddress,
      stakingProxyKey,
      staking,
      mockStakingCaller.address,
      claimsManagerProxy.address,
      mockDelegateManager.address
    )

    // --- Set up claims manager contract permissions
    let txs = await _lib.configureClaimsManagerContractAddresses(
      governance,
      guardianAddress,
      claimsManagerProxyKey,
      claimsManager,
      staking.address,
      mockStakingCaller.address,
      mockDelegateManager.address
    )

    await expectEvent.inTransaction(txs.stakingAddressTx.tx, ClaimsManager, 'StakingAddressUpdated', { _newStakingAddress: stakingProxy.address })
    await expectEvent.inTransaction(txs.govAddressTx.tx, ClaimsManager, 'GovernanceAddressUpdated', { _newGovernanceAddress: governance.address })
    await expectEvent.inTransaction(txs.spAddressTx.tx, ClaimsManager, 'ServiceProviderFactoryAddressUpdated', { _newServiceProviderFactoryAddress: mockStakingCaller.address })
    await expectEvent.inTransaction(txs.delManAddressTx.tx, ClaimsManager, 'DelegateManagerAddressUpdated', { _newDelegateManagerAddress: mockDelegateManager.address })

    let communityPoolAddress = await claimsManager.getCommunityPoolAddress()
    let communityFundingAmount = await claimsManager.getRecurringCommunityFundingAmount()
    assert.isTrue(_lib.addressZero === communityPoolAddress, "Expect zero adddress")
    assert.isTrue(communityFundingAmount.eq(_lib.toBN(0)), "Expect zero percent")
  })

  it('Initiate a claim', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero treasury stake prior to claim funding'
    )

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerRound = await claimsManager.getFundsPerRound()

    // Confirm no claim pending initially
    assert.isFalse((await claimsManager.claimPending(staker)), 'Expect no pending claim')

    // Successfully initiate round via governance guardian address
    let initiateTx = await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress)
    await expectEvent.inTransaction(
      initiateTx.tx,
      ClaimsManager,
      'RoundInitiated',
      { _roundNumber: _lib.toBN(1), _fundAmount: fundsPerRound }
    )

    // Confirm a claim is pending
    assert.isTrue((await claimsManager.claimPending(staker)), 'Expect pending claim')

    // Try and directly initiate claim
    await _lib.assertRevert(
      claimsManager.processClaim(staker, 0),
      'ProcessClaim only accessible to DelegateManager')

    await mockDelegateManager.testProcessClaim(staker, 0)

    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerRound.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time'
    )

    assert.isTrue(
      (await claimsManager.getTotalClaimedInRound()).eq(fundsPerRound),
      'All funds expected to be claimed')

    // Confirm another funding round cannot be immediately started
    await _lib.assertRevert(
      _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress),
      "Governance: Transaction failed."
    )

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      mockDelegateManager.testProcessClaim(staker, 0),
      'Claim already processed for user'
    )

    // Advance blocks to the next valid claim
    let lastClaimBlock = await claimsManager.getLastFundedBlock()
    let claimDiff = await claimsManager.getFundingRoundBlockDiff()
    let nextClaimBlock = lastClaimBlock.add(claimDiff)
    await time.advanceBlockTo(nextClaimBlock)

    // Successfully initiate round from non-staked account
    await claimsManager.initiateRound({ from: accounts[8] })
    assert.isTrue(
      (await staking.totalStakedFor(accounts[8])).isZero(),
      'Account does not have zero stake'
    )
  })

  it('Initiate multiple rounds, 1x block diff', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding'
    )

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerClaim = await claimsManager.getFundsPerRound()

    // Initiate round
    await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress)
    let claimTx = await mockDelegateManager.testProcessClaim(staker, 0)
    await expectEvent.inTransaction(
      claimTx.tx,
      ClaimsManager,
      'ClaimProcessed',
      { _claimer: staker, _rewards: fundsPerClaim, _oldTotal: DEFAULT_AMOUNT, _newTotal: DEFAULT_AMOUNT.add(fundsPerClaim) }
    )
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded
    await _lib.assertRevert(
      _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress),
      "Governance: Transaction failed."
    )

    let lastClaimBlock = await claimsManager.getLastFundedBlock()
    let claimDiff = await claimsManager.getFundingRoundBlockDiff()
    let nextClaimBlock = lastClaimBlock.add(claimDiff)

    // Advance blocks to the next valid claim
    await time.advanceBlockTo(nextClaimBlock)

    // No change expected after block diff
    totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    let accountStakeBeforeSecondClaim = await staking.totalStakedFor(staker)
    let expectedFinalValue = accountStakeBeforeSecondClaim.add(fundsPerClaim)

    // Initiate another round
    await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress)
    claimTx = await mockDelegateManager.testProcessClaim(staker, 0)
    await expectEvent.inTransaction(
      claimTx.tx, ClaimsManager,
      'ClaimProcessed',
      { _claimer: staker, _rewards: fundsPerClaim, _oldTotal: accountStakeBeforeSecondClaim, _newTotal: expectedFinalValue }
    )

    totalStaked = await staking.totalStaked()
    let finalAcctStake = await staking.totalStakedFor(staker)

    assert.isTrue(finalAcctStake.eq(expectedFinalValue), 'Expect additional increase in stake after 2nd claim')
  })

  it('Initiate single claim after 2x claim block diff', async () => {
    // Get funds per claim
    let fundsPerClaim = await claimsManager.getFundsPerRound()
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Initiate 1st claim
    await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress)

    let lastClaimBlock = await claimsManager.getLastFundedBlock()
    let claimDiff = await claimsManager.getFundingRoundBlockDiff()
    let twiceClaimDiff = claimDiff.mul(_lib.toBN(2))
    let nextClaimBlockTwiceDiff = lastClaimBlock.add(twiceClaimDiff)

    // Advance blocks to the target
    await time.advanceBlockTo(nextClaimBlockTwiceDiff)

    // Initiate claim
    await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress)
    await mockDelegateManager.testProcessClaim(staker, 0)
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded, despite 2x block diff
    await _lib.assertRevert(
      _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress),
      "Governance: Transaction failed."
    )
  })

  it('Updates funding amount', async () => {
    const currentFunding = await claimsManager.getFundsPerRound()
    const newAmountVal = _lib.audToWei(1000)
    let newAmount = _lib.toBN(newAmountVal)

    assert.isTrue(!newAmount.eq(currentFunding), 'Expect change in funding value')

    await _lib.assertRevert(
      claimsManager.updateFundingAmount(newAmount, { from: accounts[7] }),
      'Only callable by Governance contract'
    )

    let govTx = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'updateFundingAmount(uint256)',
      _lib.abiEncode(['uint256'], [newAmountVal]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(govTx.tx, ClaimsManager, 'FundingAmountUpdated', { _amount: newAmountVal })

    let updatedFundingAmount = await claimsManager.getFundsPerRound()
    assert.isTrue(newAmount.eq(updatedFundingAmount), 'Expect updated funding amount')
  })

  it('Updates fundRoundBlockDiff', async () => {
    const curBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
    const proposedBlockDiff = curBlockDiff.mul(_lib.toBN(2))

    await _lib.assertRevert(
      claimsManager.updateFundingRoundBlockDiff(proposedBlockDiff, { from: accounts[7] }),
      'Only callable by Governance contract'
    )

    let govTx = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'updateFundingRoundBlockDiff(uint256)',
      _lib.abiEncode(['uint256'], [_lib.fromBN(proposedBlockDiff)]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      govTx.tx,
      ClaimsManager,
      'FundingRoundBlockDiffUpdated',
      { _blockDifference: proposedBlockDiff }
    )

    const newBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
    assert.isTrue(newBlockDiff.eq(proposedBlockDiff), 'Expected updated block diff')
  })

  it('Bound violation during claim processing,', async () => {
    let invalidAmount = _lib.audToWeiBN(5)
    // Mark invalid bounds
    await mockStakingCaller.updateBounds(false)
    // Stake default amount
    await approveTransferAndStake(invalidAmount, staker)
    await _lib.initiateFundingRound(governance, claimsManagerProxyKey, guardianAddress, true)
    let accountStake = await staking.totalStakedFor(staker)
    let claimTx = await mockDelegateManager.testProcessClaim(staker, 0)
    // Confirm event emitted even if no reward
    await expectEvent.inTransaction(claimTx.tx, ClaimsManager, 'ClaimProcessed', { _claimer: staker, _rewards: '0' })
    let accountStakeAfterClaim = await staking.totalStakedFor(staker)
    assert.isTrue(accountStake.eq(accountStakeAfterClaim), 'Expect NO reward due to bound violation')
  })

  it('Fail to update configs calling directly to ClaimsManager contract', async () => {
    // Governance address
    await _lib.assertRevert(
      claimsManager.setGovernanceAddress(newUpdateAddress),
      'Only callable by Governance contract'
    )

    // staking
    await _lib.assertRevert(
      claimsManager.setStakingAddress(newUpdateAddress),
      'Only callable by Governance contract'
    )

    // service provider factory
    await _lib.assertRevert(
      claimsManager.setServiceProviderFactoryAddress(newUpdateAddress),
      'Only callable by Governance contract'
    )

    // delegate manager
    await _lib.assertRevert(
      claimsManager.setDelegateManagerAddress(newUpdateAddress),
      'Only callable by Governance contract'
    )

    await _lib.assertRevert(
      claimsManager.updateCommunityPoolAddress(newUpdateAddress),
      'Only callable by Governance contract'
    )
    await _lib.assertRevert(
      claimsManager.updateRecurringCommunityFundingAmount(10),
      'Only callable by Governance contract'
    )
  })

  it('Update community pool configs through Governance', async () => {
    let newCommunityFundingAmt = 10
    let percentTx = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateRecurringCommunityFundingAmount(uint256)',
      _lib.abiEncode(['uint256'], [newCommunityFundingAmt]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      percentTx.tx,
      ClaimsManager,
      'RecurringCommunityFundingAmountUpdated',
      { _amount: _lib.toBN(newCommunityFundingAmt) }
    )
    let communityFundingAmount = await claimsManager.getRecurringCommunityFundingAmount()
    assert.isTrue(communityFundingAmount.eq(_lib.toBN(newCommunityFundingAmt)), "Expect zero percent")
    let newCommunityPoolAddr = accounts[10]
    let poolAddrTx = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateCommunityPoolAddress(address)',
      _lib.abiEncode(['address'], [newCommunityPoolAddr]),
      { from: guardianAddress }
    )
    await expectEvent.inTransaction(
      poolAddrTx.tx,
      ClaimsManager,
      'CommunityPoolAddressUpdated',
      { _newCommunityPoolAddress: newCommunityPoolAddr }
    )
    let communityPoolAddress = await claimsManager.getCommunityPoolAddress()
    assert.isTrue(newCommunityPoolAddr === communityPoolAddress, "Expect updated adddress")
  })

  it('Initiate a claim with community rewards enabled', async () => {
    let newCommunityFundingAmount = 10
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateRecurringCommunityFundingAmount(uint256)',
      _lib.abiEncode(['uint256'], [newCommunityFundingAmount]),
      { from: guardianAddress }
    )
    let communityFundingAmount = await claimsManager.getRecurringCommunityFundingAmount()
    assert.isTrue(communityFundingAmount.eq(_lib.toBN(newCommunityFundingAmount)), "Expect updated percent")

    let newCommunityPoolAddr = accounts[10]
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateCommunityPoolAddress(address)',
      _lib.abiEncode(['address'], [newCommunityPoolAddr]),
      { from: guardianAddress }
    )
    let communityPoolAddress = await claimsManager.getCommunityPoolAddress()
    assert.isTrue(newCommunityPoolAddr === communityPoolAddress, "Expect updated adddress")

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)
    let initialTokenSupply = await token.totalSupply()

    let initiateTx = await claimsManager.initiateRound({ from: staker })

    let tokenSupplyAfterRoundInitiated = await token.totalSupply()

    assert.isTrue(
      (tokenSupplyAfterRoundInitiated).eq(initialTokenSupply.add(communityFundingAmount)),
      "Expect increase in amount"
    )

    let communityPoolBal = await token.balanceOf(communityPoolAddress)
    assert.isTrue(communityPoolBal.eq(communityFundingAmount), "Expect transfer to community pool after 1 round")

    // Confirm events
    await expectEvent.inTransaction(
      initiateTx.tx,
      ClaimsManager,
      'CommunityRewardsTransferred',
      { _transferAddress: newCommunityPoolAddr,
        _amount: _lib.toBN(newCommunityFundingAmount)
      }
    )
  })

  it('Community reward disabled, valid communityPoolAddress + zero communityFundingAmount', async () => {
    let newAddress = accounts[10]
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateCommunityPoolAddress(address)',
      _lib.abiEncode(['address'], [newAddress]),
      { from: guardianAddress }
    )
    let communityPoolAddress = await claimsManager.getCommunityPoolAddress()
    assert.isTrue(newAddress === communityPoolAddress, "Expect updated adddress")
    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)
    let initialTokenSupply = await token.totalSupply()
    await claimsManager.initiateRound({ from: staker })
    let tokenSupplyAfterRoundInitiated = await token.totalSupply()

    assert.isTrue(
      (tokenSupplyAfterRoundInitiated).eq(initialTokenSupply),
      "Expect NO increase in amount"
    )

    let communityPoolBal = await token.balanceOf(communityPoolAddress)
    assert.isTrue(
      communityPoolBal.eq(_lib.toBN(0)),
      "Expect no transfer to community pool after 1 round if funding amount is 0"
    )
  })

  it('Community reward disabled, invalid communityPoolAddress + non-zero communityFundingAmount', async () => {
    let newCommunityFundingAmount = 10
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateRecurringCommunityFundingAmount(uint256)',
      _lib.abiEncode(['uint256'], [newCommunityFundingAmount]),
      { from: guardianAddress }
    )
    let communityFundingAmount = await claimsManager.getRecurringCommunityFundingAmount()
    assert.isTrue(communityFundingAmount.eq(_lib.toBN(newCommunityFundingAmount)), "Expect updated percent")
    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)
    let initialTokenSupply = await token.totalSupply()
    await claimsManager.initiateRound({ from: staker })
    let tokenSupplyAfterRoundInitiated = await token.totalSupply()
    assert.isTrue(
      (tokenSupplyAfterRoundInitiated).eq(initialTokenSupply),
      "Expect NO increase in amount"
    )
    let communityPoolAddress = await claimsManager.getCommunityPoolAddress()
    assert.isTrue(communityPoolAddress === _lib.addressZero, "Confirm no address has been set")
    let communityPoolBal = await token.balanceOf(communityPoolAddress)
    assert.isTrue(
      communityPoolBal.eq(_lib.toBN(0)),
      "Expect no transfer to community pool after 1 round if funding amount is 0"
    )
  })

  it('Set the new Governance address if called from current ClaimsManager contract', async () => {
    assert.equal(
      governance.address,
      await claimsManager.getGovernanceAddress(),
      "expected governance address before changing"
    )

    // fail to set a non governance address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        claimsManagerProxyKey,
        callValue0,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [accounts[9]]),
        { from: guardianAddress }
      ),
      "Governance: Transaction failed."
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'setGovernanceAddress(address)',
      _lib.abiEncode(['address'], [mockStakingCaller.address]),
      { from: guardianAddress }
    )

    assert.equal(
      mockStakingCaller.address,
      await claimsManager.getGovernanceAddress(),
      "updated governance addresses don't match"
    )
  })

  it('Set the new Staking address if called from current ClaimsManager contract', async () => {
    assert.equal(
      staking.address,
      await claimsManager.getStakingAddress(),
      "expected Staking address before changing"  
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [newUpdateAddress]),
      { from: guardianAddress }
    )

    assert.equal(
      newUpdateAddress,
      await claimsManager.getStakingAddress(),
      "updated Staking addresses don't match"
    )
  })

  it('Set the new ServiceProvider address if called from current ClaimsManager contract', async () => {
    assert.equal(
      mockStakingCaller.address,
      await claimsManager.getServiceProviderFactoryAddress(),
      "expected ServiceProvider address before changing"  
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [newUpdateAddress]),
      { from: guardianAddress }
    )

    assert.equal(
      newUpdateAddress,
      await claimsManager.getServiceProviderFactoryAddress(),
      "updated ServiceProvider addresses don't match"
    )
  })

  it('Set the new DelegateManager address if called from current ClaimsManager contract', async () => {
    assert.equal(
      mockDelegateManager.address,
      await claimsManager.getDelegateManagerAddress(),
      "expected DelegateManager address before changing"  
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [newUpdateAddress]),
      { from: guardianAddress }
    )

    assert.equal(
      newUpdateAddress,
      await claimsManager.getDelegateManagerAddress(),
      "updated DelegateManager addresses don't match"
    )
  })
})
