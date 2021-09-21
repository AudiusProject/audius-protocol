import * as _lib from '../utils/lib.js'
const blockGasLimit = _lib.blockGasLimit
const { time, expectEvent } = require('@openzeppelin/test-helpers')

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const StakingUpgraded = artifacts.require('StakingUpgraded')
const Governance = artifacts.require('Governance')
const GovernanceUpgraded = artifacts.require('GovernanceUpgraded')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const DelegateManager = artifacts.require('DelegateManager')
const TestContract = artifacts.require('TestContract')
const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')

const MockAccount = artifacts.require('MockAccount')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManagerKey')
const tokenRegKey = web3.utils.utf8ToHex('Token')
const registryRegKey = web3.utils.utf8ToHex('Registry')

const Outcome = Object.freeze({
  InProgress: 0,
  Rejected: 1,
  ApprovedExecuted: 2,
  QuorumNotMet: 3,
  ApprovedExecutionFailed: 4,
  // Evaluating - transient internal state
  Vetoed: 6,
  TargetContractAddressChanged: 7,
  TargetContractCodeHashChanged: 8
})

const Vote = Object.freeze({
  None: 0,
  No: 1,
  Yes: 2
})

contract('Governance.sol', async (accounts) => {
  let token, registry, staking, stakingProxy, serviceProviderFactory
  let claimsManager, delegateManager, governance, registry0, registryProxy, token0, tokenProxy

  const votingPeriod = 10
  const votingQuorumPercent = 10
  const maxInProgressProposals = 20
  const executionDelay = votingPeriod
  const deployerCutLockupDuration = 11
  const undelegateLockupDuration = votingPeriod + executionDelay + 1
  const decreaseStakeLockupDuration = undelegateLockupDuration

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

  const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
  const testEndpoint1 = 'https://localhost:5000'
  const testEndpoint2 = 'https://localhost:5001'

  const proposalDescription = "TestDescription"
  const proposalName = "Test Proposal Name"
  const stakerAccount1 = accounts[10]
  const stakerAccount2 = accounts[11]
  const delegatorAccount1 = accounts[12]

  const defaultStakeAmount = _lib.audToWeiBN(1000)
  const callValue0 = _lib.toBN(0)
  const spMinStake = _lib.audToWei(5)
  const spMaxStake = _lib.audToWei(10000000)

  /**
   * Deploy dependent contracts, deploy Governance contract, setup initial contract configs
   */
  beforeEach(async () => {
    // Deploy registry
    registry0 = await Registry.new({ from: proxyDeployerAddress })
    const registryInitData = _lib.encodeCall('initialize', [], [])
    registryProxy = await AudiusAdminUpgradeabilityProxy.new(
      registry0.address,
      proxyAdminAddress,
      registryInitData,
      { from: proxyDeployerAddress }
    )
    registry = await Registry.at(registryProxy.address)

    // Deploy + register Governance contract
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress,
      maxInProgressProposals
    )
    await registry.addContract(governanceKey, governance.address, { from: proxyDeployerAddress })

    // Deploy + register token
    token0 = await AudiusToken.new({ from: proxyDeployerAddress })
    const tokenInitData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenOwnerAddress, governance.address]
    )
    tokenProxy = await AudiusAdminUpgradeabilityProxy.new(
      token0.address,
      governance.address,
      tokenInitData,
      { from: proxyDeployerAddress }
    )
    token = await AudiusToken.at(tokenProxy.address)
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    // Deploy + register Staking
    const staking0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [
        token.address,
        governance.address
      ]
    )
    stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      governance.address,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(stakingProxy.address)
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: proxyDeployerAddress })

    // Deploy + register ServiceTypeManager
    const serviceTypeManager0 = await ServiceTypeManager.new({ from: proxyDeployerAddress })
    const serviceTypeInitializeData = _lib.encodeCall(
      'initialize',
      ['address'],
      [governance.address]
    )
    const serviceTypeManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      governance.address,
      serviceTypeInitializeData,
      { from: proxyAdminAddress }
    )
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address, { from: proxyDeployerAddress })

    // Register discprov serviceType
    await _lib.addServiceType(testDiscProvType, spMinStake, spMaxStake, governance, guardianAddress, serviceTypeManagerProxyKey)

    // Deploy + register claimsManagerProxy
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

    // Deploy + Register ServiceProviderFactory contract
    const serviceProviderFactory0 = await ServiceProviderFactory.new({ from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256', 'uint256'],
      [
        governance.address,
        claimsManager.address,
        decreaseStakeLockupDuration,
        deployerCutLockupDuration
      ]
    )
    const serviceProviderFactoryProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory0.address,
      governance.address,
      serviceProviderFactoryCalldata,
      { from: proxyAdminAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: proxyDeployerAddress })

    // Register new contract as a minter, from the same address that deployed the contract
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [claimsManager.address]),
      { from: guardianAddress }
    )

    // Deploy + register DelegateManager contract
    const delegateManagerInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256'],
      [token.address, governance.address, undelegateLockupDuration]
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
    // ---- Set up claims manager contract permissions
    await _lib.configureClaimsManagerContractAddresses(
      governance,
      guardianAddress,
      claimsManagerProxyKey,
      claimsManager,
      staking.address,
      serviceProviderFactory.address,
      delegateManager.address
    )

    // ---- Set up delegateManager contract permissions
    await _lib.configureDelegateManagerAddresses(
      governance,
      guardianAddress,
      delegateManagerKey,
      delegateManager,
      staking.address,
      serviceProviderFactory.address,
      claimsManager.address
    )

    // ---- Set up spFactory contract permissions
    await _lib.configureServiceProviderFactoryAddresses(
      governance,
      guardianAddress,
      serviceProviderFactoryKey,
      serviceProviderFactory,
      staking.address,
      serviceTypeManagerProxy.address,
      claimsManager.address,
      delegateManager.address
    )
  })

  /**
   * Transfer tokens & register 2 SPs
   */
  beforeEach(async () => {
    // Transfer 1000 tokens to stakerAccount1, stakerAccount2, and delegatorAccount1
    await token.transfer(stakerAccount1, defaultStakeAmount, { from: proxyDeployerAddress })
    await token.transfer(stakerAccount2, defaultStakeAmount, { from: proxyDeployerAddress })
    await token.transfer(delegatorAccount1, defaultStakeAmount, { from: proxyDeployerAddress })

    // Record initial staker account token balance
    const initialBalance = await token.balanceOf(stakerAccount1)

    // Register two SPs with stake
    const tx1 = await _lib.registerServiceProvider(
      token,
      staking,
      serviceProviderFactory,
      testDiscProvType,
      testEndpoint1,
      defaultStakeAmount,
      stakerAccount1
    )
    await _lib.registerServiceProvider(
      token,
      staking,
      serviceProviderFactory,
      testDiscProvType,
      testEndpoint2,
      defaultStakeAmount,
      stakerAccount2
    )

    // Confirm event has correct amount
    assert.isTrue(tx1.stakeAmount.eq(defaultStakeAmount))

    // Confirm new token balances
    const finalBalance = await token.balanceOf(stakerAccount1)
    assert.isTrue(
      initialBalance.eq(
        finalBalance.add(defaultStakeAmount)
      ),
      "Expected initialBalance == finalBalance + defaultStakeAmount"
    )
  })

  it('Initialize require statements', async () => {
    const governance0 = await Governance.new({ from: proxyDeployerAddress })
    const newMaxInProgressProposals = 100
    const initializeArgumentTypesArray = ['address', 'uint256', 'uint256', 'uint256', 'uint16', 'address']
    
    // Requires non-zero _registryAddress
    let governanceCallData = _lib.encodeCall(
      'initialize',
      initializeArgumentTypesArray,
      [0x0, votingPeriod, executionDelay, votingQuorumPercent, newMaxInProgressProposals, proxyDeployerAddress]
    )

    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        proxyAdminAddress,
        governanceCallData,
        { from: proxyDeployerAddress, gas: _lib.blockGasLimit }
      )
    )

    // Requires non-zero _votingPeriod
    governanceCallData = _lib.encodeCall(
      'initialize',
      initializeArgumentTypesArray,
      [registry.address, 0, executionDelay, votingQuorumPercent, newMaxInProgressProposals, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        governance.address,
        governanceCallData,
        { from: proxyDeployerAddress, gas: _lib.blockGasLimit }
      )
    )

    // Requires non-zero _votingQuorumPercent
    governanceCallData = _lib.encodeCall(
      'initialize',
      initializeArgumentTypesArray,
      [registry.address, votingPeriod, executionDelay, 0, newMaxInProgressProposals, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        governance.address,
        governanceCallData,
        { from: proxyDeployerAddress, gas: _lib.blockGasLimit }
      )
    )

    // Requires non-zero _guardianAddress
    governanceCallData = _lib.encodeCall(
      'initialize',
      initializeArgumentTypesArray,
      [registry.address, votingPeriod, executionDelay, votingQuorumPercent, newMaxInProgressProposals, _lib.addressZero]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        governance.address,
        governanceCallData,
        { from: proxyDeployerAddress, gas: _lib.blockGasLimit }
      )
    )

    // Requires non-zero _maxInProgressProposals
    governanceCallData = _lib.encodeCall(
      'initialize',
      initializeArgumentTypesArray,
      [registry.address, votingPeriod, executionDelay, votingQuorumPercent, 0, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        governance.address,
        governanceCallData,
        { from: proxyDeployerAddress, gas: _lib.blockGasLimit }
      )
    )
  })

  it('stakingAddress management', async () => {
    // Deploy Registry
    const registry2 = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register Governance
    const governance2 = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry2,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress
    )
    await registry2.addContract(governanceKey, governance2.address, { from: proxyDeployerAddress })

    // Deploy + register AudiusToken
    const token2 = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance2.address
    )
    await registry2.addContract(tokenRegKey, token2.address, { from: proxyDeployerAddress })

    // Deploy + register Staking
    const staking2_0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData2 = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [
        token2.address,
        governance2.address
      ]
    )
    const stakingProxy2 = await AudiusAdminUpgradeabilityProxy.new(
      staking2_0.address,
      governance2.address,
      stakingInitializeData2,
      { from: proxyDeployerAddress }
    )
    const staking2 = await Staking.at(stakingProxy2.address)
    await registry2.addContract(stakingProxyKey, stakingProxy2.address, { from: proxyDeployerAddress })
    
    // Confirm staking address is zero initially
    assert.equal(await governance2.getStakingAddress.call(), _lib.addressZero)

    // Confirm staking address cannot be set from non-governance2 address
    await _lib.assertRevert(
      governance2.setStakingAddress(staking2.address, { from: proxyDeployerAddress }),
      "revert"
    )

    // Confirm staking address cannot be set to zero address
    await _lib.assertRevert(
      governance2.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setStakingAddress(address)',
        _lib.abiEncode(['address'], [_lib.addressZero]),
        { from: guardianAddress }
      ),
      "revert"
    )

    // Successfully set staking address via governance
    await governance2.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [staking2.address]),
      { from: guardianAddress }
    )

    // Confirm staking address has been set
    assert.equal(await governance2.getStakingAddress.call(), staking2.address)
  })

  it('ServiceProviderFactoryAddress management', async () => {
    // Deploy + register ServiceProviderFactory
    const serviceProviderFactory2_0 = await ServiceProviderFactory.new({ from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata2 = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256', 'uint256'],
      [
        governance.address,
        claimsManager.address,
        decreaseStakeLockupDuration,
        deployerCutLockupDuration
      ]
    )
    const serviceProviderFactoryProxy2 = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory2_0.address,
      governance.address,
      serviceProviderFactoryCalldata2,
      { from: proxyAdminAddress }
    )

    let serviceProviderFactory2 = await ServiceProviderFactory.at(serviceProviderFactoryProxy2.address)
    // Confirm serviceProviderFactory address cannot be set from non-governance address
    await _lib.assertRevert(
      governance.setServiceProviderFactoryAddress(
        serviceProviderFactory2.address,
        { from: proxyDeployerAddress }
      ),
      "revert"
    )
    // Confirm serviceProviderFactory cannot be set to zero address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setServiceProviderFactoryAddress(address)',
        _lib.abiEncode(['address'], [_lib.addressZero]),
        { from: guardianAddress }
      ),
      "revert"
    )

    // Successfully set serviceProviderFactoryAddress via governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactory2.address]),
      { from: guardianAddress }
    )

    // Confirm serviceProviderFactoryAddress has been set
    assert.equal(await governance.getServiceProviderFactoryAddress(), serviceProviderFactory2.address)
  })

  it('DelegateManagerAddress management', async () => {
    // Deploy DelegateManager contract
    const delegateManagerInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256'],
      [token.address, governance.address, undelegateLockupDuration]
    )
    let delegateManager1 = await DelegateManager.new({ from: proxyDeployerAddress })
    let delegateManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      delegateManager1.address,
      governance.address,
      delegateManagerInitializeData,
      { from: proxyDeployerAddress }
    )
    let delegateManager2 = await DelegateManager.at(delegateManagerProxy.address)

    // Confirm delegateManager address cannot be set from non-governance address
    await _lib.assertRevert(
      governance.setDelegateManagerAddress(
        delegateManager2.address,
        { from: proxyDeployerAddress }
      ),
      "revert"
    )

    // Confirm delegateManager cannot be set to zero address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setDelegateManagerAddress(address)',
        _lib.abiEncode(['address'], [_lib.addressZero]),
        { from: guardianAddress }
      ),
      "revert"
    )

    // Successfully set delegateManager via governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManager2.address]),
      { from: guardianAddress }
    )

    // Confirm delegateManager has been set
    assert.equal(await governance.getDelegateManagerAddress(), delegateManager2.address)
  })

  it('registryAddress management', async () => {
    // Confirm initial registryAddress value
    assert.equal(await governance.getRegistryAddress.call(), registry.address)

    const registry2 = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Fail to set registry address from non-governance address
    await _lib.assertRevert(
      governance.setRegistryAddress(registry2.address, { from: proxyDeployerAddress }),
      "revert"
    )

    // Confirm registry address cannot be set to zero address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setRegistryAddress(address)',
        _lib.abiEncode(['address'], [_lib.addressZero]),
        { from: guardianAddress }
      ),
      "revert"
    )

    // Successfully set registry address via governance
    let setRegistryAddressTx = await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setRegistryAddress(address)',
      _lib.abiEncode(['address'], [registry2.address]),
      { from: guardianAddress }
    )

    // Confirm event log
    setRegistryAddressTx = _lib.parseTx(setRegistryAddressTx)
    assert.equal(setRegistryAddressTx.event.args._newRegistryAddress, registry2.address, 'Expected newRegistryAddress')

    // Confirm registry address has been set
    assert.equal(await governance.getRegistryAddress.call(), registry2.address)
  })


  const getStakeInfo = async (address) => {
    let spInfo = await serviceProviderFactory.getServiceProviderDetails(address)
    let totalDeployerStake = spInfo.deployerStake
    let pendingDecreaseStakeReq = await serviceProviderFactory.getPendingDecreaseStakeRequest(address)
    let totalDelegatedStake = await delegateManager.getTotalDelegatorStake(address)
    let pendingUndelegateStakeReq = await delegateManager.getPendingUndelegateRequest(address)
    let totalStake = totalDeployerStake.add(totalDelegatedStake)
    let totalLockedUpStake = pendingDecreaseStakeReq.amount.add(pendingUndelegateStakeReq.amount)
    let totalActiveStake = totalStake.sub(totalLockedUpStake)
    return {
      totalStake,
      totalActiveStake,
      totalLockedUpStake,
      totalDeployerStake,
      totalDelegatedStake
    }
  }

  describe('Submit Proposal Active Stake Validation', async () => {
    let targetAddress = stakerAccount2
    let callValue = _lib.toBN(0)
    let slashAmount = _lib.toBN(1)
    let functionSignature = 'slash(uint256,address)'
    let callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
    // An address that has only delegated stake should be able to submit a proposal
    let delegateAmount = defaultStakeAmount.div(_lib.toBN(2))

    beforeEach(async() => {
      // Approve staking transfer
      await token.approve(
        staking.address,
        delegateAmount,
        { from: delegatorAccount1 })
      // Delegate half default stake amount
      await delegateManager.delegateStake(
        stakerAccount1,
        delegateAmount,
        { from: delegatorAccount1 }
      )
    })

    const submitAndVerifySlashProposalSubmitted = async(senderAccount, ) => {
      let submitProposalTxReceipt = await governance.submitProposal(
        delegateManagerKey,
        callValue,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: senderAccount }
      )
      // Always expect proposal ID 1
      await expectEvent.inTransaction(
        submitProposalTxReceipt.tx,
        Governance,
        'ProposalSubmitted',
        {
          _proposalId: _lib.toBN(1),
          _proposer: senderAccount,
          _name: proposalName,
          _description: proposalDescription
        }
      )
    }

    const submitAndVerifySlashProposalFailure = async(senderAccount) => {
      await _lib.assertRevert(
        governance.submitProposal(
          delegateManagerKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: senderAccount }
        ),
        "Governance: Proposer must be address with non-zero total active stake or be guardianAddress"
      )
    }

    it('Submit proposal via delegator address', async () => {
      let delegationFromContract = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let totalStakedForDelegator = await staking.totalStakedFor(delegatorAccount1)
      assert.isTrue(delegationFromContract.eq(delegateAmount), "Expected equivalent value in contract")
      assert.isTrue(totalStakedForDelegator.eq(_lib.toBN(0)), "No direct stake expected")
      await submitAndVerifySlashProposalSubmitted(delegatorAccount1)
    })

    it('Submit proposal from delegator-only address w/partially undelegated stake', async () => {
      let delegationFromContract = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let totalStakedForDelegator = await staking.totalStakedFor(delegatorAccount1)
      assert.isTrue(delegationFromContract.eq(delegateAmount), "Expected equivalent value in contract")
      assert.isTrue(totalStakedForDelegator.eq(_lib.toBN(0)), "No direct stake expected")
      let undelegateAmount = delegationFromContract.div(_lib.toBN(2)) 
      await delegateManager.requestUndelegateStake(
        stakerAccount1,
        undelegateAmount,
        { from: delegatorAccount1 }
      )
      let stakeInfo = await getStakeInfo(delegatorAccount1)
      assert.isTrue(stakeInfo.totalActiveStake.gt(_lib.toBN(0)), "Expect some active stake")
      assert.isTrue(stakeInfo.totalLockedUpStake.gt(_lib.toBN(0)), "Expect some locked stake")
      await submitAndVerifySlashProposalSubmitted(delegatorAccount1)
    })

    it('Submit proposal via delegator address w/no active stake', async () => {
      let delegationFromContract = await delegateManager.getTotalDelegatorStake(delegatorAccount1)
      let totalStakedForDelegator = await staking.totalStakedFor(delegatorAccount1)
      assert.isTrue(delegationFromContract.eq(delegateAmount), "Expected equivalent value in contract")
      assert.isTrue(totalStakedForDelegator.eq(_lib.toBN(0)), "No direct stake expected")
      await delegateManager.requestUndelegateStake(
        stakerAccount1,
        delegationFromContract,
        { from: delegatorAccount1 }
      )
      await submitAndVerifySlashProposalFailure(delegatorAccount1)
    })

    it('Submit proposal from invalid address', async () => {
      // Address with no stake in ServiceProviderFactory or DelegateManager
      const invalidAddress = accounts[14]
      const totalDelegated = await delegateManager.getTotalDelegatorStake(invalidAddress)
      const totalStaked = await staking.totalStakedFor(invalidAddress)
      const spInfo = await serviceProviderFactory.getServiceProviderDetails(invalidAddress)
      assert.isTrue(totalDelegated.eq(_lib.toBN(0)), "Expect 0")
      assert.isTrue(totalStaked.eq(_lib.toBN(0)), "Expect 0")
      assert.isTrue(spInfo.deployerStake.eq(_lib.toBN(0)), "Expect 0")
      await submitAndVerifySlashProposalFailure(invalidAddress)
    })

    it('Submit proposal via service provider address w/no active stake', async () => {
      // Account with all stake locked up in sp factory
      // Expected to fail
      await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount, { from: stakerAccount1 })
      let stakeInfo = await getStakeInfo(stakerAccount1)
      assert.isTrue(stakeInfo.totalActiveStake.eq(_lib.toBN(0)), "Expect no active stake")
      await submitAndVerifySlashProposalFailure(stakerAccount1)
    })

    it('Submit proposal from delegator + sp address w/partial active stake', async () => {
      await token.transfer(stakerAccount1, delegateAmount, { from: proxyDeployerAddress })
      await token.approve(staking.address, delegateAmount, { from: stakerAccount1 })

      // Delegate half default stake amount from stakerAccount1 -> stakerAccount2
      await delegateManager.delegateStake(
        stakerAccount2,
        delegateAmount,
        { from: stakerAccount1 }
      )
      // Lock up partial funds in both spfactory, delegatemanager 
      await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount.div(_lib.toBN(2)), { from: stakerAccount1 })
      await delegateManager.requestUndelegateStake(stakerAccount2, delegateAmount.div(_lib.toBN(3)), { from: stakerAccount1 })
      await submitAndVerifySlashProposalSubmitted(stakerAccount1)
    })

    it('Submit proposal via service provider + delegator address w/no active stake', async () => {
      // Account has delegated some stake, and has deployer stake
      // Account has locked up all stake in sp factory, delegate manager
      // Approve staking transfer
      await token.transfer(stakerAccount1, delegateAmount, { from: proxyDeployerAddress })
      await token.approve(staking.address, delegateAmount, { from: stakerAccount1 })

      // Delegate half default stake amount from stakerAccount1 -> stakerAccount2
      await delegateManager.delegateStake(
        stakerAccount2,
        delegateAmount,
        { from: stakerAccount1 }
      )
      // Lock up funds in service provider factory and delegate manager by initiating withrdawal
      await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount, { from: stakerAccount1 })
      await delegateManager.requestUndelegateStake(stakerAccount2, delegateAmount, { from: stakerAccount1 })
      let stakeInfo = await getStakeInfo(stakerAccount1)
      assert.isTrue(stakeInfo.totalActiveStake.eq(_lib.toBN(0)), "Expect zero active stake")
      await submitAndVerifySlashProposalFailure(stakerAccount1)
    })
  })

  describe('Proposal end-to-end test - slash action', async () => {
    it('Initial state - Ensure no Proposals exist yet', async () => {
      await _lib.assertRevert(governance.getProposalById(0), 'Must provide valid non-zero _proposalId')
      await _lib.assertRevert(governance.getProposalById(1), 'Must provide valid non-zero _proposalId')

      // getProposalById with invalid proposalId
      await _lib.assertRevert(
        governance.getProposalById(5),
        "Must provide valid non-zero _proposalId"
      )

      // getVoteInfoByProposalAndVoter with invalid proposalId
      await _lib.assertRevert(
        governance.getVoteInfoByProposalAndVoter(5, accounts[5]),
        "Must provide valid non-zero _proposalId"
      )
    })

    it('Should fail to submit Proposal for unregistered target contract', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = web3.utils.utf8ToHex('invalidKey')
      const callValue = _lib.toBN(0)
      const functionSignature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        ),
        "_targetContractRegistryKey must point to valid registered contract"
      )
    })

    it('Should fail to submit Proposal with no functionSignature', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const callValue = _lib.toBN(0)
      const callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
      
      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          '',
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        ),
        "_functionSignature cannot be empty."
      )
    })

    it('Should fail to submit Proposal from address that is not staker / guardian', async () => {
      const proposerAddress = accounts[15]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = web3.utils.utf8ToHex("invalidKey")
      const callValue = _lib.toBN(0)
      const functionSignature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])

      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        ),
        "Governance: Proposer must be address with non-zero total active stake or be guardianAddress."
      )
    })

    it('Fail to submitProposal when an outstanding proposal exists', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      // Successfully submit a proposal
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        signature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )

      // advance to make eligible to evaluate
      const proposalStartBlockNumber = parseInt(txReceipt.receipt.blockNumber)
      await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)

      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue0,
          signature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        ),
        "Cannot submit new proposal until all evaluatable InProgress proposals are evaluated."
      )
    })

    it('Should fail to submit Proposal when maxInProgressProposals is reached', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      // Successfully submit a proposal
      await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        signature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )

      // Update maxInProgressProposals to max of 2
      await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setMaxInProgressProposals(uint16)',
        _lib.abiEncode(['uint16'], [2]),
        { from: guardianAddress }
      )

      // Successfully submit a second proposal
      await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        signature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )
      // should fail to add a third in progress if two are outstanding
      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue0,
          signature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        ),
        "Number of InProgress proposals already at max. Please evaluate if possible, or wait for current proposals' votingPeriods to expire."
      )
    })

    it('Proposal name', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      const nameTooShort = ""
      const nameCorrect = proposalName

      // Fail to submit with empty name
      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue0,
          signature,
          callData,
          nameTooShort,
          proposalDescription,
          { from: proposerAddress }
        )
      )

      // Successfully submit with non-empty name
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        signature,
        callData,
        nameCorrect,
        proposalDescription,
        { from: proposerAddress }
      )
      const tx = _lib.parseTx(txReceipt)

      // Confirm name value in event log
      assert.equal(tx.event.args._name, nameCorrect, "Expected same event.args.name")
    })

    it('Proposal description', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      const descriptionTooShort = ""
      const descriptionCorrect = proposalDescription

      // Fail to submit with empty description
      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue0,
          signature,
          callData,
          proposalName,
          descriptionTooShort,
          { from: proposerAddress }
        )
      )

      // Successfully submit with non-empty description
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        signature,
        callData,
        proposalName,
        descriptionCorrect,
        { from: proposerAddress }
      )
      const tx = _lib.parseTx(txReceipt)

      // Confirm description value in event log
      assert.equal(tx.event.args._description, descriptionCorrect, "Expected same event.args.description")
    })

    it('Submit Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContractRegistryKey = delegateManagerKey
      const targetContractAddress = delegateManager.address
      const functionSignature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      // Call submitProposal
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )

      // Confirm event log
      const txParsed = _lib.parseTx(txReceipt)
      assert.equal(txParsed.event.name, 'ProposalSubmitted', 'Expected same event name')
      assert.equal(parseInt(txParsed.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsed.event.args._proposer, proposerAddress, 'Expected same event.args.proposer')
      assert.isTrue(parseInt(txReceipt.receipt.blockNumber) > lastBlock, 'Expected submitProposalTx blockNumber > lastBlock')
      assert.equal(txParsed.event.args._description, proposalDescription, "Expected same event.args.description")

      // Call getProposalById() and confirm same values
      const proposal = await governance.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(txReceipt.receipt.blockNumber) > lastBlock, 'Expected submitProposalTx blockNumber > lastBlock')
      assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
      assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
      assert.equal(proposal.callValue.toNumber(), callValue0, 'Expected same proposal.callValue')
      assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 0, 'Expected same numVotes')
      
      // Confirm all account vote states - all Vote.None and voteMagnitude 0
      for (const account of accounts) {
        const {vote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter.call(proposalId, account)
        assert.equal(vote, Vote.None)
        assert.isTrue(voteMagnitude.isZero())
      }
    })

    it('Submit proposal successfully via guardian address', async () => {
      const proposalId = 1
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContractRegistryKey = delegateManagerKey
      const targetContractAddress = delegateManager.address
      const functionSignature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      // Call submitProposal
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue0,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: guardianAddress }
      )

      // Confirm event log
      const txParsed = _lib.parseTx(txReceipt)
      assert.equal(txParsed.event.name, 'ProposalSubmitted', 'Expected same event name')
      assert.equal(parseInt(txParsed.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsed.event.args._proposer, guardianAddress, 'Expected same event.args.proposer')
      assert.isTrue(parseInt(txReceipt.receipt.blockNumber) > lastBlock, 'Expected submitProposalTx blockNumber > lastBlock')
      assert.equal(txParsed.event.args._description, proposalDescription, "Expected same event.args.description")

      // Call getProposalById() and confirm same values
      const proposal = await governance.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, guardianAddress, 'Expected same proposer')
      assert.isTrue(parseInt(txReceipt.receipt.blockNumber) > lastBlock, 'Expected submitProposalTx blockNumber > lastBlock')
      assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
      assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
      assert.equal(proposal.callValue.toNumber(), callValue0, 'Expected same proposal.callValue')
      assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 0, 'Expected same numVotes')

      // Confirm all account vote states - all Vote.None and voteMagnitude 0
      for (const account of accounts) {
        const {vote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter.call(proposalId, account)
        assert.equal(vote, Vote.None)
        assert.isTrue(voteMagnitude.isZero())
      }
    })

    describe('Proposal voting', async () => {
      let proposalId, proposerAddress, slashAmount, targetAddress, voter1Address, voter2Address
      let defaultVote, lastBlock, targetContractRegistryKey, targetContractAddress
      let callValue, functionSignature, callData, submitProposalTxReceipt
      let proposalStartBlockNumber

      beforeEach(async () => {
        proposalId = 1
        proposerAddress = stakerAccount1
        slashAmount = _lib.toBN(1)
        targetAddress = stakerAccount2
        voter1Address = stakerAccount1
        voter2Address = stakerAccount2
        defaultVote = Vote.None
        lastBlock = (await _lib.getLatestBlock(web3)).number
        targetContractRegistryKey = delegateManagerKey
        targetContractAddress = delegateManager.address
        callValue = _lib.toBN(0)
        functionSignature = 'slash(uint256,address)'
        callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
  
        // Call submitProposal
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
      })

      describe('Active stake validation', async () => {
        let delegateAmount = defaultStakeAmount.div(_lib.toBN(2))
        beforeEach(async() => {
          // Approve staking transfer
          await token.approve(staking.address, delegateAmount, { from: delegatorAccount1 })
          // Delegate half default stake amount
          await delegateManager.delegateStake(stakerAccount1, delegateAmount, { from: delegatorAccount1 })
        })

        const submitAndVerifyActiveStakeVoteFailure = async (proposal, vote, voter) => {
          await _lib.assertRevert(
            governance.submitVote(proposal, vote, { from: voter }),
            "Governance: Voter must be address with non-zero total active stake" 
          )
        } 

        const submitAndVerifyActiveStakeVoteSuccess = async (proposal, vote, voter, expectedVoteMagnitude) => {
          const voteTxReceipt = await governance.submitVote(proposal, vote, { from: voter })
          await expectEvent.inTransaction(
            voteTxReceipt.tx,
            Governance,
            'ProposalVoteSubmitted',
            {
              _proposalId: _lib.toBN(proposal),
              _voter: voter,
              _vote: _lib.toBN(vote),
              _voterStake: expectedVoteMagnitude
            }
          )
          const {vote: voterVote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter(proposal, voter)
          assert.equal(voterVote, vote)
          assert.isTrue(voteMagnitude.eq(expectedVoteMagnitude))
        }

        it('Evaluate with no votes', async () => {
          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
          let evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: stakerAccount1 })
          await expectEvent.inTransaction(
            evaluateTxReceipt.tx,
            Governance,
            'ProposalOutcomeEvaluated',
            {
              _proposalId: _lib.toBN(proposalId),
              _outcome: _lib.toBN(Outcome.QuorumNotMet),
              _voteMagnitudeYes: _lib.toBN(0),
              _voteMagnitudeNo: _lib.toBN(0),
              _numVotes: _lib.toBN(0),
            }
          )
        })

        /*
         submit proposal (measure totalStakedAt this block)
         → submit vote(s) to meet quorum
         → increase stake in system (either from voter or diff acct)
         → call evaluate and confirm quorum calc is unaffected and proposal still passes and voteMagnitudes are the same
        */
        it('Confirm quorum change after submission does not prevent proposal evaluation', async () => {
          let totalStakeAtProposalTime = await staking.totalStakedAt(_lib.toBN(proposalStartBlockNumber))
          let proposal = await governance.getProposalById(proposalId)
          let totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)
          let proposalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalStakeAtProposalTime)
          // Vote from stakerAccount1 with current stake
          const voteYes = Vote.Yes
          await governance.submitVote(proposalId, voteYes, { from: stakerAccount1 })

          proposal = await governance.getProposalById(proposalId)
          totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)
          proposalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalStakeAtProposalTime)

          // Increase stake from a new account by delegating
          let additionalDelegationAmount = defaultStakeAmount.mul(_lib.toBN(13))
          await token.transfer(delegatorAccount1, additionalDelegationAmount, { from: proxyDeployerAddress })
          await token.approve(staking.address, additionalDelegationAmount, { from: delegatorAccount1 })
          await delegateManager.delegateStake(stakerAccount2, additionalDelegationAmount,{ from: delegatorAccount1 })

          let delegatorInfo = await getStakeInfo(delegatorAccount1)
          assert.isTrue(delegatorInfo.totalDeployerStake.eq(_lib.toBN(0)), "No deployer stake expected")
          assert.isTrue(
            delegatorInfo.totalDelegatedStake.eq(delegateAmount.add(additionalDelegationAmount)),
            "Delegator stake expected"
          )

          // Current total stake
          let totalCurrentStake = await staking.totalStaked()
          proposal = await governance.getProposalById(proposalId)
          totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)
          proposalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalStakeAtProposalTime)
          let totalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalCurrentStake)

          // Vote from stakerAccount2
          await governance.submitVote(proposalId, voteYes, { from: stakerAccount2 })
          let staker2Info = await getStakeInfo(stakerAccount2)
          const {vote: voterVote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter(proposalId, stakerAccount2)
          assert.isTrue(voteMagnitude.eq(staker2Info.totalDeployerStake), "Expect delegated stake exclusion")

          // Increase stake from account 1
          let increaseAmount = defaultStakeAmount.mul(_lib.toBN(5))
          await token.transfer(stakerAccount1, increaseAmount, { from: proxyDeployerAddress })
          await token.approve(staking.address, increaseAmount, { from: stakerAccount1 })
          await serviceProviderFactory.increaseStake(increaseAmount, { from: stakerAccount1})

          totalCurrentStake = await staking.totalStaked()
          proposal = await governance.getProposalById(proposalId)
          totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)
          proposalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalStakeAtProposalTime)
          totalParticipationPercent = (totalVotedStake.mul(_lib.toBN(100))).div(totalCurrentStake)
          // Confirm that all votes are < current quorum given totalStake
          assert.isTrue(totalParticipationPercent.lt(_lib.toBN(votingQuorumPercent)), "Total participation should be less than quorum")
          // Confirm that all votes are > proposal expected quorum
          assert.isTrue(proposalParticipationPercent.gt(_lib.toBN(votingQuorumPercent)), "Total particpation from initial proposal submission should be greater than quorum")
          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
          let evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: stakerAccount1 })
          // Confirm approved executed despite not meeting quorum
          await expectEvent.inTransaction(
            evaluateTxReceipt.tx,
            Governance,
            'ProposalOutcomeEvaluated',
            {
              _proposalId: _lib.toBN(proposalId),
              _outcome: _lib.toBN(Outcome.ApprovedExecuted),
              _numVotes: _lib.toBN(2)
            }
          )
        })

        // Validate behavior with particular stake distributions
        it('Submit vote from service provider only address w/partial active stake', async () => {
          const vote = Vote.Yes
          let decreaseAmount = defaultStakeAmount.div(_lib.toBN(2)).sub(_lib.toBN(1)) // (defaultStakeAmount / 2) + 1
          // Lock up partial funds in spfactory
          await serviceProviderFactory.requestDecreaseStake(decreaseAmount, { from: voter1Address })
          let stakeInfo = await getStakeInfo(voter1Address)
          await submitAndVerifyActiveStakeVoteSuccess(proposalId, vote, voter1Address, stakeInfo.totalActiveStake)

          let proposal = await governance.getProposalById(proposalId)
          assert.isTrue(proposal.voteMagnitudeYes.eq(stakeInfo.totalActiveStake), `Expected voteMagnitudeYes: ${proposal.voteMagnitudeYes.toString()} to equal active stake ${stakeInfo.totalActiveStake.toString()}`)
          assert.isFalse(proposal.voteMagnitudeYes.eq(stakeInfo.totalStake), `Expected voteMagnitudeYes: ${proposal.voteMagnitudeYes.toString()} to NOT equal total stake ${stakeInfo.totalStake.toString()}`)
          let totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)

          let minQuorumStake = (stakeInfo.totalStake.mul(_lib.toBN(votingQuorumPercent))).div(_lib.toBN(100)) // (total stake * quorum %) / 100
          assert.isTrue(totalVotedStake.gt(minQuorumStake), "Total voted stake should be greater than quorum")

          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
          let evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: stakerAccount1 })

          await expectEvent.inTransaction(
            evaluateTxReceipt.tx,
            Governance,
            'ProposalOutcomeEvaluated',
            {
              _proposalId: _lib.toBN(proposalId),
              _outcome: _lib.toBN(Outcome.ApprovedExecuted),
              _numVotes: _lib.toBN(1)
            }
          )
        })

        it('Submit vote from service provider only address w/partial active stake under quorum, execution will fail', async () => {
          const vote = Vote.Yes
          let decreaseAmount = defaultStakeAmount.sub(_lib.toBN(_lib.audToWei('1'))) // reduce active stake to 1 aud from 1000
          // Lock up partial funds in spfactory
          await serviceProviderFactory.requestDecreaseStake(decreaseAmount, { from: voter1Address })
          let stakeInfo = await getStakeInfo(voter1Address)
          await submitAndVerifyActiveStakeVoteSuccess(proposalId, vote, voter1Address, stakeInfo.totalActiveStake)
          let proposal = await governance.getProposalById(proposalId)
          let totalVotedStake = proposal.voteMagnitudeYes.add(proposal.voteMagnitudeNo)

          assert.isTrue(proposal.voteMagnitudeYes.eq(stakeInfo.totalActiveStake), `Expected voteMagnitudeYes: ${proposal.voteMagnitudeYes.toString()} to equal active stake ${stakeInfo.totalActiveStake.toString()}`)
          assert.isFalse(proposal.voteMagnitudeYes.eq(stakeInfo.totalStake), `Expected voteMagnitudeYes: ${proposal.voteMagnitudeYes.toString()} to NOT equal total stake ${stakeInfo.totalStake.toString()}`)

          let minQuorumStake = (stakeInfo.totalStake.mul(_lib.toBN(votingQuorumPercent))).div(_lib.toBN(100)) // (total stake * quorum %) / 100
          assert.isTrue(totalVotedStake.lt(minQuorumStake), "Total voted stake should be less than quorum")
          
          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
          let evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: stakerAccount1 })

          await expectEvent.inTransaction(
            evaluateTxReceipt.tx,
            Governance,
            'ProposalOutcomeEvaluated',
            {
              _proposalId: _lib.toBN(proposalId),
              _outcome: _lib.toBN(Outcome.QuorumNotMet),
              _numVotes: _lib.toBN(1)
            }
          )
        })

        it('Submit vote from delegator-only address', async () => {
          const vote = Vote.No
          // Lock up partial funds in delegatemanager 
          let stakeInfo = await getStakeInfo(delegatorAccount1)
          assert.isTrue(stakeInfo.totalDeployerStake.eq(_lib.toBN(0)))
          assert.isTrue(stakeInfo.totalStake.eq(delegateAmount))
          assert.isTrue(stakeInfo.totalActiveStake.eq(delegateAmount))
          await submitAndVerifyActiveStakeVoteSuccess(proposalId, vote, delegatorAccount1, stakeInfo.totalActiveStake)
        })

        it('Submit vote from delegator-only address w/partially undelegated stake', async () => {
          const vote = Vote.No
          let undelegateAmount = delegateAmount.div(_lib.toBN(2))
          await delegateManager.requestUndelegateStake(stakerAccount1, undelegateAmount, { from: delegatorAccount1 })
          // Lock up partial funds in delegatemanager 
          let stakeInfo = await getStakeInfo(delegatorAccount1)
          assert.isTrue(stakeInfo.totalDeployerStake.eq(_lib.toBN(0)))
          assert.isTrue(stakeInfo.totalStake.eq(delegateAmount))
          assert.isTrue(stakeInfo.totalActiveStake.eq(delegateAmount.sub(undelegateAmount)))
          const voteTxReceipt = await governance.submitVote(proposalId, vote, { from: delegatorAccount1 })
          await expectEvent.inTransaction(
            voteTxReceipt.tx,
            Governance,
            'ProposalVoteSubmitted',
            {
              _proposalId: _lib.toBN(proposalId),
              _voter: delegatorAccount1,
              _vote: _lib.toBN(vote),
              _voterStake: stakeInfo.totalActiveStake
            }
          )
          const {vote: voterVote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter(proposalId, delegatorAccount1)
          assert.equal(voterVote, vote)
          assert.isTrue(voteMagnitude.eq(stakeInfo.totalActiveStake))
        })

        it('Submit vote from delegator-only address w/no active stake', async () => {
          const vote = Vote.No
          let undelegateAmount = delegateAmount
          await delegateManager.requestUndelegateStake(stakerAccount1, undelegateAmount, { from: delegatorAccount1 })
          // Lock up all funds in both delman
          let stakeInfo = await getStakeInfo(delegatorAccount1)
          assert.isTrue(stakeInfo.totalStake.eq(delegateAmount))
          assert.isTrue(stakeInfo.totalDelegatedStake.eq(delegateAmount))
          assert.isTrue(stakeInfo.totalDeployerStake.eq(_lib.toBN(0)))
          assert.isTrue(stakeInfo.totalActiveStake.eq(_lib.toBN(0)))
          await submitAndVerifyActiveStakeVoteFailure(proposalId, vote, delegatorAccount1)
        })

        it('Submit vote from invalid address', async () => {
          const vote = Vote.No
          // Address with no stake in ServiceProviderFactory or DelegateManager
          const invalidAddress = accounts[14]
          const totalDelegated = await delegateManager.getTotalDelegatorStake(invalidAddress)
          const totalStaked = await staking.totalStakedFor(invalidAddress)
          const spInfo = await serviceProviderFactory.getServiceProviderDetails(invalidAddress)
          assert.isTrue(totalDelegated.eq(_lib.toBN(0)), "Expect 0")
          assert.isTrue(totalStaked.eq(_lib.toBN(0)), "Expect 0")
          assert.isTrue(spInfo.deployerStake.eq(_lib.toBN(0)), "Expect 0")
          await submitAndVerifyActiveStakeVoteFailure(proposalId, vote, invalidAddress)
        })

        it('Submit vote from service provider only address w/no active stake', async () => {
          const vote = Vote.No
          // Initiate decrease stake request of all assets
          await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount, { from: stakerAccount1 })
          let stakeInfo = await getStakeInfo(stakerAccount1)
          assert.isTrue(stakeInfo.totalStake.eq(defaultStakeAmount))
          assert.isTrue(stakeInfo.totalDeployerStake.eq(defaultStakeAmount))
          assert.isTrue(stakeInfo.totalDelegatedStake.eq(_lib.toBN(0)))
          assert.isTrue(stakeInfo.totalActiveStake.eq(_lib.toBN(0)))
          await submitAndVerifyActiveStakeVoteFailure(proposalId, vote, stakerAccount1)
        })

        it('Submit vote from delegator + sp address w/partial active stake', async () => {
          const vote = Vote.No
          await token.transfer(stakerAccount1, delegateAmount, { from: proxyDeployerAddress })
          await token.approve(staking.address, delegateAmount, { from: stakerAccount1 })
          // Delegate half default stake amount from stakerAccount1 -> stakerAccount2
          // Now this account has staked through serviceProviderFactory AND delegateManager
          await delegateManager.delegateStake(stakerAccount2, delegateAmount, { from: stakerAccount1 })
          // Lock up partial funds in both spfactory, delegatemanager 
          await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount.div(_lib.toBN(2)), { from: stakerAccount1 })
          await delegateManager.requestUndelegateStake(stakerAccount2, delegateAmount.div(_lib.toBN(3)), { from: stakerAccount1 })
          let stakeInfo = await getStakeInfo(stakerAccount1)
          await submitAndVerifyActiveStakeVoteSuccess(proposalId, vote, stakerAccount1, stakeInfo.totalActiveStake)
        })

        it('Submit vote from delegator + sp address w/no active stake', async () => {
          const vote = Vote.No
          await token.transfer(stakerAccount1, delegateAmount, { from: proxyDeployerAddress })
          await token.approve(staking.address, delegateAmount, { from: stakerAccount1 })
          // Delegate half default stake amount from stakerAccount1 -> stakerAccount2
          // Now this account has staked through serviceProviderFactory AND delegateManager
          await delegateManager.delegateStake(stakerAccount2, delegateAmount, { from: stakerAccount1 })
          await serviceProviderFactory.requestDecreaseStake(defaultStakeAmount, { from: stakerAccount1 })
          await delegateManager.requestUndelegateStake(stakerAccount2, delegateAmount, { from: stakerAccount1 })
          let stakeInfo = await getStakeInfo(stakerAccount1)
          assert.isTrue(stakeInfo.totalActiveStake.eq(_lib.toBN(0)), "Expect zero stake")
          await submitAndVerifyActiveStakeVoteFailure(proposalId, vote, stakerAccount1)
        })

        it('Update vote fails to increase magnitude past initial vote, even if new value has been staked by this address', async () => {
          const voteYes = Vote.No
          const voteNo = Vote.No
          let stakeInfo1 = await getStakeInfo(stakerAccount1)

          // Submit vote with initial state, from staker account
          await submitAndVerifyActiveStakeVoteSuccess(proposalId, voteNo, stakerAccount1, stakeInfo1.totalActiveStake)

          // Increase stake for account
          let increaseAmount = defaultStakeAmount.div(_lib.toBN(2))
          await token.transfer(stakerAccount1, increaseAmount, { from: proxyDeployerAddress })
          await token.approve(staking.address, increaseAmount, { from: stakerAccount1 })
          await serviceProviderFactory.increaseStake(increaseAmount, { from: stakerAccount1 })

          // Confirm updated stake on chain
          let stakeInfo2 = await getStakeInfo(stakerAccount1)
          assert.isTrue(stakeInfo2.totalStake.eq(stakeInfo1.totalDeployerStake.add(increaseAmount)), "Mismatched state")

          // Confirm voter active stake has changed
          assert.isTrue((stakeInfo2.totalActiveStake.sub(stakeInfo1.totalActiveStake)).eq(increaseAmount), "Expect increase in active stake")

          // Submit vote update 
          // Confirm that voter stake is equal to the initial active, and note active prior to update
          const voteTx3 = await governance.updateVote(proposalId, voteYes, { from: stakerAccount1 })
          await expectEvent.inTransaction(
            voteTx3.tx,
            Governance,
            'ProposalVoteUpdated',
            {
              _proposalId: _lib.toBN(proposalId),
              _voter: stakerAccount1,
              _vote: _lib.toBN(voteYes),
              _voterStake: stakeInfo1.totalActiveStake,
              _previousVote: _lib.toBN(voteNo)
            }
          )
          // Confirm vote magnitude after the update is equal to initial vote magnitude, NOT totalActiveStake after increase
          const {vote: voterVote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter(proposalId, stakerAccount1)
          assert.equal(voterVote, voteYes)
          assert.isTrue(voteMagnitude.eq(stakeInfo1.totalActiveStake))
        })
      })

      it('Fail to vote with invalid proposalId', async () => {
        await _lib.assertRevert(
          governance.submitVote(5, Vote.Yes, { from: stakerAccount1 }),
          "Governance: Must provide valid non-zero _proposalId"
        )
      })

      it('Fail to vote with invalid voter', async () => {
        await _lib.assertRevert(
          governance.submitVote(proposalId, Vote.Yes, { from: accounts[15] }),
          "Governance: Voter must be address with non-zero total active stake."
        )
      })

      it('Fail to vote after votingPeriod has ended', async () => {
        // Advance blocks to the next valid claim
        const proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)

        await _lib.assertRevert(
          governance.submitVote(proposalId, Vote.Yes, { from: stakerAccount1 }),
          "Proposal votingPeriod has ended"
        )
      })

      it('Fail to submit invalid vote', async () => {
        await _lib.assertRevert(
          governance.submitVote(proposalId, Vote.None, { from: stakerAccount1 }),
          "Can only submit a Yes or No vote"
        )
      })

      it('Fail to update vote if no previous vote submitted', async () => {
        await _lib.assertRevert(
          governance.updateVote(proposalId, Vote.Yes, { from: stakerAccount1 }),
          "To submit new vote, call submitVote()"
        )
      })

      it('Successfully vote on Proposal for Slash', async () => {
        const vote = Vote.No
        
        // Call submitVote()
        const txReceipt = await governance.submitVote(proposalId, vote, { from: voter1Address })
  
        // Confirm event log
        const txParsed = _lib.parseTx(txReceipt)
        assert.equal(txParsed.event.name, 'ProposalVoteSubmitted', 'Expected same event name')
        assert.equal(parseInt(txParsed.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsed.event.args._voter, voter1Address, 'Expected same event.args.voter')
        assert.equal(parseInt(txParsed.event.args._vote), vote, 'Expected same event.args.vote')
        assert.isTrue(txParsed.event.args._voterStake.eq(defaultStakeAmount), 'Expected same event.args.voterStake')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(proposal.submissionBlockNumber > lastBlock, 'Expected submissionBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.isTrue(proposal.callValue.eq(callValue), 'Expected same proposal.callValue')
        assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.eq(defaultStakeAmount), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all account vote states - Vote.No, defaultStakeAmount for Voter, Vote.None, 0 for all others
        for (const account of accounts) {
          const {vote: voterVote, voteMagnitude} = await governance.getVoteInfoByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.isTrue(voteMagnitude.eq(defaultStakeAmount))
            assert.equal(voterVote, vote)
          } else {
            assert.equal(voterVote, defaultVote)
            assert.isTrue(voteMagnitude.isZero())
          }
        }
      })

      it('Successfully vote multiple times with diff accounts', async () => {
        const voteYes = Vote.Yes
        const voteNo = Vote.No

        // voter1 voteYes
        const voteTx1 = await governance.submitVote(proposalId, voteYes, { from: voter1Address })
        const voteTxParsed1 = _lib.parseTx(voteTx1)
        assert.equal(parseInt(voteTxParsed1.event.args._vote), voteYes, 'Expected same event.args.vote')
  
        // voter2 voteYes
        const voteTx2 = await governance.submitVote(proposalId, voteYes, { from: voter2Address })
        const voteTxParsed2 = _lib.parseTx(voteTx2)
        assert.equal(parseInt(voteTxParsed2.event.args._vote), voteYes, 'Expected same event.args.vote')

        await _lib.assertRevert(
          governance.submitVote(proposalId, voteNo, { from: voter1Address }),
          "To update previous vote, call updateVote()"
        )

        // Confirm proposal state
        let proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.eq(defaultStakeAmount.mul(_lib.toBN(2))), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.isZero(), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 2, 'Expected same numVotes')
  
        // voter1 update to voteNo
        const voteTx3 = await governance.updateVote(proposalId, voteNo, { from: voter1Address })
        const voteTxParsed3 = _lib.parseTx(voteTx3)
        assert.equal(parseInt(voteTxParsed3.event.args._vote), voteNo, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed3.event.args._previousVote), voteYes, 'Expected same event.args.previousVote')
  
        // voter1 update to voteYes
        const voteTx4 = await governance.updateVote(proposalId, voteYes, { from: voter1Address })
        const voteTxParsed4 = _lib.parseTx(voteTx4)
        assert.equal(parseInt(voteTxParsed4.event.args._vote), voteYes, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed4.event.args._previousVote), voteNo, 'Expected same event.args.previousVote')

        // voter1 update to same
        const voteTx5 = await governance.updateVote(proposalId, voteYes, { from: voter1Address })
        const voteTxParsed5 = _lib.parseTx(voteTx5)
        assert.equal(parseInt(voteTxParsed5.event.args._vote), voteYes, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed5.event.args._previousVote), voteYes, 'Expected same event.args.previousVote')
  
        // Confirm proposal state
        proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.eq(defaultStakeAmount.mul(_lib.toBN(2))), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.isZero(), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 2, 'Expected same numVotes')

        // Get the list of in progress proposals
        var inProgressProposals = (await governance.getInProgressProposals.call())
        assert.equal(
          inProgressProposals.length,
          1,
          'Incorrect number of returned getInProgressProposals values'
        )
        assert.equal(
          _lib.fromBN(inProgressProposals[0]),
          proposalId,
          'Incorrect getInProgressProposals value'
        )
  
        // Confirm vote states
        const vote1Info = await governance.getVoteInfoByProposalAndVoter.call(proposalId, voter1Address)
        assert.equal(vote1Info.vote, voteYes)
        assert.isTrue(vote1Info.voteMagnitude.eq(defaultStakeAmount))
        const vote2Info = await governance.getVoteInfoByProposalAndVoter.call(proposalId, voter2Address)
        assert.equal(vote2Info.vote, voteYes)
        assert.isTrue(vote2Info.voteMagnitude.eq(defaultStakeAmount))
      })

      it('Reject a proposal with a tie', async () => {
        await governance.submitVote(proposalId, Vote.Yes, { from: stakerAccount1 })
        await governance.submitVote(proposalId, Vote.No, { from: stakerAccount2 })
        
        // Confirm proposal state
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.eq(defaultStakeAmount), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 2, 'Expected same numVotes')

        const proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)

        let evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        const [txParsedEvent0] = _lib.parseTx(evaluateTxReceipt, true)
        
        // Confirm outcome state
        assert.equal(txParsedEvent0.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent0.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsedEvent0.event.args._outcome, Outcome.Rejected, 'Expected same event.args.outcome')
        assert.isTrue(txParsedEvent0.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsedEvent0.event.args._voteMagnitudeNo.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(txParsedEvent0.event.args._numVotes), 2, 'Expected same event.args.numVotes')
      })
    })

    describe('Proposal evaluation', async () => {
      let proposalId, proposerAddress, slashAmountNum, slashAmount, targetAddress, voter1Address, voter2Address
      let voter1Vote, defaultVote, lastBlock, targetContractRegistryKey, targetContractAddress, callValue
      let functionSignature, callData, outcome, returnData, initialTotalStake, initialStakeAcct2, initialTokenSupply
      let submitProposalTxReceipt, proposalStartBlockNumber, evaluateTxReceipt

      /** Define vars, submit proposal, submit votes, advance blocks to end of votingPeriod + executionDelay */
      beforeEach(async () => {
        // Define vars
        proposalId = 1
        proposerAddress = stakerAccount1
        slashAmountNum = _lib.audToWei(500)
        slashAmount = _lib.toBN(slashAmountNum)
        targetAddress = stakerAccount2
        voter1Address = stakerAccount1
        voter2Address = stakerAccount2
        voter1Vote = Vote.Yes
        defaultVote = Vote.None
        lastBlock = (await _lib.getLatestBlock(web3)).number
        targetContractRegistryKey = delegateManagerKey
        targetContractAddress = delegateManager.address
        callValue = _lib.audToWei(0)
        functionSignature = 'slash(uint256,address)'
        callData = _lib.abiEncode(['uint256', 'address'], [slashAmountNum, targetAddress])
        outcome = Outcome.ApprovedExecuted
        returnData = null
  
        // Confirm initial Stake state
        initialTotalStake = await staking.totalStaked()
        assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(_lib.toBN(2))))
        initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))
        initialTokenSupply = await token.totalSupply()
  
        // Call submitProposal + submitVote
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        await governance.submitVote(proposalId, voter1Vote, { from: voter1Address })
  
        // Advance blocks to end of proposal votingPeriod + executionDelay
        proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
      })

      it('Fail to evaluate proposal with invalid proposalId', async () => {
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(5, { from: proposerAddress }),
          "Must provide valid non-zero _proposalId."
        )
      })

      it('Call to evaluate proposal from non-staker will succeed', async () => {
        governance.evaluateProposalOutcome(proposalId, { from: accounts[15] })
      })

      it('Fail to evaluate proposal before votingPeriod and executionDelay have ended', async () => {
        // Evaluate all previous evaluatable proposals so new proposals can be submitted
        await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalId = _lib.parseTx(submitProposalTxReceipt).event.args._proposalId
        
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(
            proposalId,
            { from: proposerAddress }
          ),
          "Proposal votingPeriod & executionDelay must end before evaluation."
        )

        // Advance blocks to end of proposal votingPeriod
        proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)

        await _lib.assertRevert(
          governance.evaluateProposalOutcome(
            proposalId,
            { from: proposerAddress }
          ),
          "Proposal votingPeriod & executionDelay must end before evaluation."
        )

        // Advance blocks to end of proposal executionDelay
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)

        await governance.evaluateProposalOutcome(
          proposalId,
          { from: proposerAddress }
        )
      })

      it('Confirm proposal evaluated correctly + transaction executed', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent0.event.args._proposalId), proposalId, 'Expected same txParsedEvent0.event.args.proposalId')
        assert.equal(txParsedEvent0.event.args._success, true, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent0.event.args._returnData, returnData, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent1.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsedEvent1.event.args._outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsedEvent1.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsedEvent1.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(txParsedEvent1.event.args._numVotes), 1, 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(parseInt(proposal.submissionBlockNumber) > lastBlock, 'Expected submissionBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVoteInfo = await governance.getVoteInfoByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.equal(voterVoteInfo.vote, voter1Vote)
            assert.isTrue(voterVoteInfo.voteMagnitude.eq(defaultStakeAmount))
          } else {
            assert.equal(voterVoteInfo.vote, defaultVote)
            assert.isTrue(voterVoteInfo.voteMagnitude.isZero())
          }
        }

        // Confirm quorum was correctly calculated
        const totalStakeAtSubmission = await staking.totalStakedAt.call(proposal.submissionBlockNumber)
        const totalVotedStake = parseInt(proposal.voteMagnitudeYes) + parseInt(proposal.voteMagnitudeNo)
        // div before mul bc js does large number math incorrectly
        const participationPercent = totalVotedStake / totalStakeAtSubmission * 100
        assert.isAtLeast(participationPercent, votingQuorumPercent, 'Quorum met')
  
        // Confirm Slash action succeeded by checking new Stake + Token values
        const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(
          finalStakeAcct2.eq(defaultStakeAmount.sub(_lib.toBN(slashAmount)))
        )
        assert.isTrue(
          (_lib.toBN(initialTotalStake)).sub(_lib.toBN(slashAmount)).eq(await staking.totalStaked()),
          'Expected same total stake amount'
        )
        assert.equal(
          await token.totalSupply(),
          initialTokenSupply - slashAmount,
          "Expected same token total supply"
        )
      })

      it('Proposal with Outcome.Rejected', async () => {
        // Evaluate all previous evaluatable proposals so new proposals can be submitted
        // Slashes stakerAcct2 stake by 1/2
        await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // create new proposal
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalId = _lib.parseTx(submitProposalTxReceipt).event.args._proposalId

        // Submit votes to achieve Outcome.Rejected
        await governance.submitVote(proposalId, Vote.No, { from: voter1Address })
        await governance.submitVote(proposalId, Vote.No, { from: voter2Address })

        // Advance blocks to the evaluatable block
        proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)

        outcome = Outcome.Rejected
        const TWO = _lib.toBN(2)
        const THREE = _lib.toBN(3)

        evaluateTxReceipt = await governance.evaluateProposalOutcome(
          _lib.parseTx(submitProposalTxReceipt).event.args._proposalId,
          { from: proposerAddress }
        )

        // Confirm event log
        const txParsed = _lib.parseTx(evaluateTxReceipt)
        assert.equal(txParsed.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(txParsed.event.args._outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsed.event.args._voteMagnitudeYes.isZero(), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsed.event.args._voteMagnitudeNo.eq(defaultStakeAmount.mul(THREE).div(TWO)), 'Expected same event.args.voteMagnitudeNo')
        assert.isTrue(txParsed.event.args._numVotes.eq(TWO), 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.eq(defaultStakeAmount.mul(THREE).div(TWO)), 'Expected same voteMagnitudeNo')
        assert.isTrue(proposal.numVotes.eq(TWO), 'Expected same numVotes')

        // Confirm quorum was correctly calculated
        const totalStakeAtSubmission = await staking.totalStakedAt.call(proposal.submissionBlockNumber)
        const totalVotedStake = parseInt(proposal.voteMagnitudeYes) + parseInt(proposal.voteMagnitudeNo)
        // div before mul bc js does large number math incorrectly
        const participationPercent = totalVotedStake / totalStakeAtSubmission * 100
        assert.isAtLeast(participationPercent, votingQuorumPercent, 'Quorum met')
      })

      it('Confirm voting quorum restriction is enforced', async () => {
        // Evaluate all previous evaluatable proposals so new proposals can be submitted
        await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Call submitProposal
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalId = _lib.parseTx(submitProposalTxReceipt).event.args._proposalId
        outcome = Outcome.QuorumNotMet

        // Advance blocks to evaluatable block
        proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)

        evaluateTxReceipt = await governance.evaluateProposalOutcome(
          _lib.parseTx(submitProposalTxReceipt).event.args._proposalId,
          { from: proposerAddress }
        )

        // Confirm event log
        const txParsed = _lib.parseTx(evaluateTxReceipt)
        assert.equal(txParsed.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsed.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsed.event.args._outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsed.event.args._voteMagnitudeYes.isZero(), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsed.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.isTrue(txParsed.event.args._numVotes.isZero(), 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.isZero(), 'Expected same voteMagnitudeNo')
        assert.isTrue(proposal.numVotes.isZero(), 'Expected same numVotes')

        // Confirm quorum was correctly calculated
        const totalStakeAtSubmission = await staking.totalStakedAt.call(proposal.submissionBlockNumber)
        const totalVotedStake = parseInt(proposal.voteMagnitudeYes) + parseInt(proposal.voteMagnitudeNo)
        // div before mul bc js does large number math incorrectly
        const participationPercent = totalVotedStake / totalStakeAtSubmission * 100
        assert.isBelow(participationPercent, votingQuorumPercent, 'Quorum not met')

        // Submit new proposal + vote
        const submitProposalTxReceipt2 = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
        const proposalId2 = _lib.parseTx(submitProposalTxReceipt2).event.args._proposalId
        await governance.submitVote(proposalId2, Vote.Yes, { from: voter1Address })

        // Confirm proposal would meet quorum
        let proposal2 = await governance.getProposalById.call(proposalId2)
        const totalVotedStake2 = parseInt(proposal2.voteMagnitudeNo) + parseInt(proposal2.voteMagnitudeYes)
        // div before mul bc js does large number math incorrectly
        let participationPercent2 = totalVotedStake2 / totalStakeAtSubmission * 100
        let latestVotingQuorumPercent = parseInt(await governance.getVotingQuorumPercent.call())
        assert.isAtLeast(participationPercent2, latestVotingQuorumPercent, 'Quorum would be met')

        // Increase quorum to failure amount
        const newVotingQuorumPercent = 75
        await governance.guardianExecuteTransaction(
          governanceKey,
          callValue0,
          'setVotingQuorumPercent(uint256)',
          _lib.abiEncode(['uint256'], [newVotingQuorumPercent]),
          { from: guardianAddress }
        )

        // Advance blocks to the evaluatable block
        const proposal2StartBlockNumber = parseInt(submitProposalTxReceipt2.receipt.blockNumber)
        await time.advanceBlockTo(proposal2StartBlockNumber + votingPeriod + executionDelay)

        // Evaluate proposal and confirm it fails
        await governance.evaluateProposalOutcome(
          _lib.parseTx(submitProposalTxReceipt2).event.args._proposalId,
          { from: proposerAddress }
        )
        let proposal2New = await governance.getProposalById.call(proposalId2)
        assert.equal(proposal2New.outcome, outcome, 'Expected QuorumNotMet outcome')

        // Confirm quorum was correctly calculated
        const totalVotedStake2New = parseInt(proposal2New.voteMagnitudeYes) + parseInt(proposal2New.voteMagnitudeNo)
        // div before mul bc js does large number math incorrectly
        const participationPercent2New = totalVotedStake2New / totalStakeAtSubmission * 100
        latestVotingQuorumPercent = parseInt(await governance.getVotingQuorumPercent.call())
        assert.isBelow(participationPercent2New, latestVotingQuorumPercent, 'Quorum not met')
      })
  
      it('Confirm Repeated evaluateProposal call fails', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
          "Can only evaluate InProgress proposal."
        )
      })

      it('evaluateProposal fails after targetContract has been upgraded', async () => {
        const testContract = await TestContract.new()
        await testContract.initialize()

        const outcomeTargetContractAddressChanged = Outcome.TargetContractAddressChanged

        // Upgrade contract registered at targetContractRegistryKey
        await registry.upgradeContract(targetContractRegistryKey, testContract.address, { from: proxyDeployerAddress })

        // ensure evaluateProposalOutcome marks proposal as invalid
        const txR = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        const tx = await _lib.parseTx(txR)
        
        // Ensure event log confirms correct outcome
        assert.equal(tx.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(tx.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(tx.event.args._outcome, outcomeTargetContractAddressChanged, 'Expected same event.args.outcome')
        assert.isTrue(tx.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(tx.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(tx.event.args._numVotes), 1, 'Expected same event.args.numVotes')
  
        // Ensure chain storage confirms correct outcome
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(parseInt(proposal.submissionBlockNumber) > lastBlock, 'Expected submissionBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, outcomeTargetContractAddressChanged, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

        // Ensure future governance actions are not blocked
        await governance.submitProposal(
          targetContractRegistryKey,
          callValue0,
          functionSignature,
          callData,
          proposalName,
          proposalDescription,
          { from: proposerAddress }
        )
      })

      it('Call evaluateProposal where transaction execution fails', async () => {
        initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))

        // Reduce stake amount below proposed slash amount
        const decreaseStakeAmount = _lib.audToWeiBN(700)
        // Request decrease in stake
        await serviceProviderFactory.requestDecreaseStake(decreaseStakeAmount, { from: stakerAccount2 })
        let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount2)
        // Advance to valid block
        await time.advanceBlockTo(requestInfo.lockupExpiryBlock)
        await serviceProviderFactory.decreaseStake({ from: stakerAccount2 })
        const decreasedStakeAcct2 = await staking.totalStakedFor.call(stakerAccount2)
        assert.isTrue(decreasedStakeAcct2.eq(initialStakeAcct2.sub(decreaseStakeAmount)))

        // Call evaluateProposalOutcome and confirm that transaction execution failed and proposal outcome is No.
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected same event name')
        assert.equal(txParsedEvent0.event.args._proposalId, proposalId, 'Expected same txParsedEvent0.event.args.proposalId')
        assert.equal(txParsedEvent0.event.args._success, false, 'Expected same txParsedEvent0.event.args.success')
        // TODO - confirm that returnData = web3.utils.utf8ToHex("Cannot slash more than total currently staked")
        // reference: https://solidity.readthedocs.io/en/develop/abi-spec.html#use-of-dynamic-types
        // assert.equal(txParsedEvent0.event.args.returnData, returnData, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent1.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsedEvent1.event.args._outcome, Outcome.ApprovedExecutionFailed, 'Expected same event.args.outcome')
        assert.isTrue(txParsedEvent1.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsedEvent1.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(txParsedEvent1.event.args._numVotes), 1, 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(parseInt(proposal.submissionBlockNumber) > lastBlock, 'Expected submissionBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, Outcome.ApprovedExecutionFailed, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVoteInfo = await governance.getVoteInfoByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.equal(voterVoteInfo.vote, voter1Vote)
            assert.isTrue(voterVoteInfo.voteMagnitude.eq(defaultStakeAmount))
          } else {
            assert.equal(voterVoteInfo.vote, defaultVote)
            assert.isTrue(voterVoteInfo.voteMagnitude.isZero())
          }
        }
  
        // Confirm Slash action failed by checking new Stake + Token values
        const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(finalStakeAcct2.eq(decreasedStakeAcct2), 'ye')
        assert.isTrue(
          (await staking.totalStaked()).eq(initialTotalStake.sub(decreaseStakeAmount)),
          'Expected total stake amount to be unchanged'
        )
        assert.isTrue((await token.totalSupply()).eq(initialTokenSupply), "Expected total token supply to be unchanged")
      })

      describe('Veto logic', async () => {
        it('Ensure only guardian can veto', async () => {
          // Fail to veto from non-guardian address
          await _lib.assertRevert(
            governance.vetoProposal(proposalId, { from: stakerAccount1 }),
            'Only guardian can veto proposals'
          )
        })

        it('Fail to veto proposal with invalid proposalId', async () => {
          const invalidProposalId = 5
          await _lib.assertRevert(
            governance.vetoProposal(invalidProposalId, { from: guardianAddress }),
            "Must provide valid non-zero _proposalId."
          )
        })

        it('Ensure only active proposal can be vetoed', async () => {
          await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })

          // Ensure proposal.outcome != InProgress
          assert.notEqual(
            (await governance.getProposalById.call(proposalId)).outcome,
            Outcome.InProgress,
            'Expected outcome != InProgress'
          )
          
          // Fail to veto due to inactive proposal
          await _lib.assertRevert(
            governance.vetoProposal(proposalId, { from: guardianAddress }),
            'Cannot veto inactive proposal.'
          )
        })

        it('Confirm veto ability before votingPeriod, after votingPeriod, after executionDelay', async () => {
          // Veto previously created proposal (votingPeriod + executionDelay have expired)
          await governance.vetoProposal(
            proposalId,
            { from: guardianAddress }
          )
          
          // Submit proposal + veto immediately, while votingPeriod is still active
          submitProposalTxReceipt = await governance.submitProposal(
            targetContractRegistryKey,
            callValue,
            functionSignature,
            callData,
            proposalName,
            proposalDescription,
            { from: proposerAddress }
          )
          await governance.vetoProposal(
            _lib.parseTx(submitProposalTxReceipt).event.args._proposalId,
            { from: guardianAddress }
          )

          // Submit proposal + veto after votingPeriod has expired
          submitProposalTxReceipt = await governance.submitProposal(
            targetContractRegistryKey,
            callValue,
            functionSignature,
            callData,
            proposalName,
            proposalDescription,
            { from: proposerAddress }
          )
          proposalId = _lib.parseTx(submitProposalTxReceipt).event.args._proposalId
          proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)
          await governance.vetoProposal(
            proposalId,
            { from: guardianAddress }
          )

          // Submit proposal + veto after executionDelay has expired
          submitProposalTxReceipt = await governance.submitProposal(
            targetContractRegistryKey,
            callValue,
            functionSignature,
            callData,
            proposalName,
            proposalDescription,
            { from: proposerAddress }
          )
          proposalId = _lib.parseTx(submitProposalTxReceipt).event.args._proposalId
          proposalStartBlockNumber = parseInt(submitProposalTxReceipt.receipt.blockNumber)
          await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod + executionDelay)
          await governance.vetoProposal(
            proposalId,
            { from: guardianAddress }
          )
        })

        it('Successfully veto proposal + ensure further actions on proposal are blocked', async () => {
          const vetoTxReceipt = await governance.vetoProposal(proposalId, { from: guardianAddress })

          // Confirm event log
          const vetoTx = _lib.parseTx(vetoTxReceipt)
          assert.equal(vetoTx.event.name, 'ProposalVetoed', 'event.name')
          assert.equal(parseInt(vetoTx.event.args._proposalId), proposalId, 'event.args.proposalId')

          // Call getProposalById() and confirm expected outcome
          const proposal = await governance.getProposalById.call(proposalId)
          assert.notEqual(proposal.outcome, Outcome.Rejected, 'wrong outcome')
          assert.equal(proposal.outcome, Outcome.Vetoed, 'outcome')
          assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'voteMagnitudeYes')
          assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'voteMagnitudeNo')
          assert.equal(parseInt(proposal.numVotes), 1, 'numVotes')

          // Confirm that further actions are blocked
          await _lib.assertRevert(
            governance.submitVote(proposalId, voter1Vote, { from: voter1Address }),
            "Governance: Proposal votingPeriod has ended"
          )
          
          await _lib.assertRevert(
            governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
            "Can only evaluate InProgress proposal."
          )
        })

        it('Ensure veto does not prevent future governance actions', async () => {
          await governance.vetoProposal(proposalId, { from: guardianAddress })

          submitProposalTxReceipt = await governance.submitProposal(
            targetContractRegistryKey,
            callValue0,
            functionSignature,
            callData,
            proposalName,
            proposalDescription,
            { from: proposerAddress }
          )
        })
      })
    })
  })

  it('Proposal end-to-end test - upgrade contract action', async () => {
    // Confirm staking.newFunction() not callable before upgrade
    const stakingCopy = await StakingUpgraded.at(staking.address)
    await _lib.assertRevert(stakingCopy.newFunction.call({ from: proxyDeployerAddress }), 'revert')

    // Deploy new logic contract to later upgrade to
    const stakingUpgraded0 = await StakingUpgraded.new({ from: proxyAdminAddress })
    
    // Define vars
    const targetContractRegistryKey = stakingProxyKey
    const targetContractAddress = staking.address
    const callValue = _lib.audToWei(0)
    const functionSignature = 'upgradeTo(address)'
    const callData = _lib.abiEncode(['address'], [stakingUpgraded0.address])
    const returnData = null

    const proposerAddress = stakerAccount1
    const voterAddress = stakerAccount1
    const outcome = Outcome.ApprovedExecuted
    const lastBlock = (await _lib.getLatestBlock(web3)).number
    
    // Submit proposal
    const submitTxReceipt = await governance.submitProposal(
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      proposalName,
      proposalDescription,
      { from: proposerAddress }
    )
    const proposalId = _lib.parseTx(submitTxReceipt).event.args._proposalId

    // Submit proposal vote for Yes
    await governance.submitVote(proposalId, Vote.Yes, { from: voterAddress })

    // Advance blocks to after proposal evaluation period + execution delay
    const proposalStartBlock = parseInt(submitTxReceipt.receipt.blockNumber)
    await time.advanceBlockTo(proposalStartBlock + votingPeriod + executionDelay)

    // Call evaluateProposalOutcome()
    const evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })

    // Confirm event log states - ProposalTransactionExecuted, ProposalOutcomeEvaluated
    const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
    assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected event.name')
    assert.equal(parseInt(txParsedEvent0.event.args._proposalId), proposalId, 'Expected event.args.proposalId')
    assert.equal(txParsedEvent0.event.args._success, true, 'Expected event.args.returnData')
    assert.equal(txParsedEvent0.event.args._returnData, returnData, 'Expected event.args.returnData')
    assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
    assert.equal(parseInt(txParsedEvent1.event.args._proposalId), proposalId, 'Expected same event.args.proposalId')
    assert.equal(txParsedEvent1.event.args._outcome, outcome, 'Expected same event.args.outcome')
    assert.isTrue(txParsedEvent1.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
    assert.isTrue(txParsedEvent1.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
    assert.equal(parseInt(txParsedEvent1.event.args._numVotes), 1, 'Expected same event.args.numVotes')

    // Call getProposalById() and confirm same values
    const proposal = await governance.getProposalById.call(proposalId)
    assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
    assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
    assert.isTrue(parseInt(proposal.submissionBlockNumber) > lastBlock, 'Expected submissionBlockNumber > lastBlock')
    assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
    assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
    assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
    assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
    assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
    assert.equal(proposal.outcome, outcome, 'Expected same outcome')
    assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
    assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
    assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

    // Confirm that contract was upgraded by ensuring staking.newFunction() call succeeds
    const stakingCopy2 = await StakingUpgraded.at(staking.address)
    const newFnResp = await stakingCopy2.newFunction.call({ from: proxyDeployerAddress })
    assert.equal(newFnResp, 5)

    // Confirm that proxy contract's implementation address has upgraded
    assert.equal(
      await stakingProxy.implementation.call({ from: proxyAdminAddress }),
      stakingUpgraded0.address,
      'Expected updated proxy implementation address'
    )
  })

  it('Contract content change prevents proposal evaluation', async () => {
    let owner = accounts[9]
    const mockAccountContract = await MockAccount.new(owner, { from: proxyDeployerAddress })
    const accountKey = web3.utils.utf8ToHex('Account')
    await registry.addContract(accountKey, mockAccountContract.address, { from: proxyDeployerAddress })

    // Define vars
    const targetContractRegistryKey = accountKey
    const callValue = _lib.audToWei(0)
    const functionSignature = 'setOwner(address)'
    const callData = _lib.abiEncode(['address'], [accounts[11]])
    const targetContractAddress = mockAccountContract.address

    const proposerAddress = stakerAccount1
    const voterAddress = stakerAccount1
    const outcome = Outcome.TargetContractCodeHashChanged
    const lastBlock = (await _lib.getLatestBlock(web3)).number

    // Submit proposal
    const submitTxReceipt = await governance.submitProposal(
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      proposalName,
      proposalDescription,
      { from: proposerAddress }
    )
    const proposalId = _lib.parseTx(submitTxReceipt).event.args._proposalId

    // Retrieve contract hash for proposal
    let proposalContractHash = await governance.getProposalTargetContractHash(proposalId)

    // Submit proposal vote for Yes
    await governance.submitVote(proposalId, Vote.Yes, { from: voterAddress })

    // Advance blocks to after proposal evaluation period
    const proposalStartBlock = parseInt(submitTxReceipt.receipt.blockNumber)
    
    await time.advanceBlockTo(proposalStartBlock + votingPeriod + executionDelay)

    // Self destruct before evaluating
    await mockAccountContract.destroy(owner, { from: owner })

    // Call evaluateProposalOutcome()
    const evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
    const [txParsedEvent0] = _lib.parseTx(evaluateTxReceipt, true)
    assert.equal(txParsedEvent0.event.name, 'ProposalOutcomeEvaluated', 'Expected event.name')
    assert.equal(parseInt(txParsedEvent0.event.args._proposalId), proposalId, 'Expected event.args.proposalId')
    assert.equal(txParsedEvent0.event.args._returnData, null, 'Expected event.args.returnData')
    assert.equal(txParsedEvent0.event.args._outcome, outcome, 'Expected same event.args.outcome')
    assert.isTrue(txParsedEvent0.event.args._voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
    assert.isTrue(txParsedEvent0.event.args._voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
    assert.equal(parseInt(txParsedEvent0.event.args._numVotes), 1, 'Expected same event.args.numVotes')

    // Call getProposalById() and confirm same values
    const proposal = await governance.getProposalById.call(proposalId)
    assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
    assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
    assert.isTrue(parseInt(proposal.submissionBlockNumber) > lastBlock, 'Expected submissionBlockNumber > lastBlock')
    assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
    assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
    assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
    assert.equal(proposal.functionSignature, functionSignature, 'Expected same proposal.functionSignature')
    assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
    assert.equal(proposal.outcome, outcome, 'Expected same outcome')
    assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
    assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
    assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

    let proposalContractHashAfterEvaluation = await governance.getProposalTargetContractHash(proposalId)
    assert.equal(proposalContractHash, proposalContractHashAfterEvaluation, 'Expect same proposal hash despite target contract diff')

    // Additional coverage for getProposalTargetContractHash
    await _lib.assertRevert(governance.getProposalTargetContractHash(0), 'Must provide valid non-zero _proposalId')
    await _lib.assertRevert(governance.getProposalTargetContractHash(10000), 'Must provide valid non-zero _proposalId')
  })

  it('Test max value of maxInProgressProposals', async () => {
    /**
     * currently confirms ~170 inprogress proposals takes about 1mm gas for submit and ~300k gas for evaluate
     * - could prob handle 1000 easy
     * potentially test + confirm real breaking point
     */
    const newMaxInProgressProposals = 100

    // Confirm all InProgress proposals are uptodate since none exist
    assert.isTrue(await governance.inProgressProposalsAreUpToDate.call(), 'Expected all proposals to be uptodate')
    
    const functionSignature = 'slash(uint256,address)'
    const slashAmount = _lib.toBN(1)
    const targetAddress = accounts[11]
    const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])
    const proposerAddress = accounts[10]

    // Increase votingPeriod so evaluatable checks succeed and new proposals can be submitted
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setVotingPeriod(uint256)',
      _lib.abiEncode(['uint256'], [newMaxInProgressProposals + 10]),
      { from: guardianAddress }
    )

    // Update maxInProgressProposals to high val
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setMaxInProgressProposals(uint16)',
      _lib.abiEncode(['uint16'], [newMaxInProgressProposals]),
      { from: guardianAddress }
    )

    // Confirm repeated submitProposal calls succeed without hitting gas limit
    for (let i = 1; i <= newMaxInProgressProposals; i++) {
      const submitProposalTxR = await governance.submitProposal(
        delegateManagerKey,
        callValue0,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )
    }

    // confirm additional submit past max fails
    await _lib.assertRevert(
      governance.submitProposal(
        delegateManagerKey,
        callValue0,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      ),
      "Number of InProgress proposals already at max. Please evaluate if possible, or wait for current proposals' votingPeriods to expire."
    )

    // Confirm all InProgress proposals are uptodate bc votingPeriod is still active
    assert.isTrue(await governance.inProgressProposalsAreUpToDate.call(), 'Expected all proposals to be uptodate')

    // Set voting period down so proposals can be evaluated
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setVotingPeriod(uint256)',
      _lib.abiEncode(['uint256'], [1]),
      { from: guardianAddress }
    )

    // Confirm all InProgress proposals are not uptodate since votingPeriod has expired
    assert.isFalse(await governance.inProgressProposalsAreUpToDate.call(), 'Expected all proposals to not be uptodate')

    for (let i = 1; i <= newMaxInProgressProposals; i++) {
      const evaluateTxR = await governance.evaluateProposalOutcome(i, { from: proposerAddress })
    }

    // Confirm all InProgress proposals are uptodate bc all have been evaluated
    assert.isTrue(await governance.inProgressProposalsAreUpToDate.call(), 'Expected all proposals to be uptodate')

    // Increase votingPeriod so evaluatable checks succeed and new proposals can be submitted
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      'setVotingPeriod(uint256)',
      _lib.abiEncode(['uint256'], [newMaxInProgressProposals + 10]),
      { from: guardianAddress }
    )

    // Submit some more proposals to make sure array storage is not corrupted after evaluation, which pops from array
    for (let i = 0; i < 10; i++) {
      const submitProposalTxR = await governance.submitProposal(
        delegateManagerKey,
        callValue0,
        functionSignature,
        callData,
        proposalName,
        proposalDescription,
        { from: proposerAddress }
      )
    }

    // Confirm all InProgress proposals are uptodate as votingPeriod is active
    assert.isTrue(await governance.inProgressProposalsAreUpToDate.call(), 'Expected all proposals to be uptodate')
  })

  describe('Guardian execute transactions', async () => {
    let slashAmount, targetAddress, targetContractRegistryKey, targetContractAddress
    let callValue, functionSignature, callData, returnData

    beforeEach(async () => {
      slashAmount = _lib.toBN(1)
      targetAddress = stakerAccount2
      targetContractRegistryKey = delegateManagerKey
      targetContractAddress = delegateManager.address
      callValue = _lib.toBN(0)
      functionSignature = 'slash(uint256,address)'
      callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
      returnData = null
    })

    it('Fail to call from non-guardian address', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          targetContractRegistryKey,
          callValue,
          functionSignature,
          callData,
          { from: stakerAccount1 }
        ),
        "Only guardian."
      )
    })

    it('Slash staker', async () => {
      // Confirm initial Stake state
      const initialTotalStake = await staking.totalStaked()
      assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(_lib.toBN(2))))
      const initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))
      const initialTokenSupply = await token.totalSupply()

      // Execute transaction
      const guardianExecTxReceipt = await governance.guardianExecuteTransaction(
        targetContractRegistryKey,
        callValue,
        functionSignature,
        callData,
        { from: guardianAddress }
      )

      // Confirm tx logs
      const guardianExecTx = _lib.parseTx(guardianExecTxReceipt)
      assert.equal(guardianExecTx.event.name, 'GuardianTransactionExecuted', 'event.name')
      assert.equal(guardianExecTx.event.args._targetContractAddress, targetContractAddress, 'event.args.targetContractAddress')
      assert.isTrue(guardianExecTx.event.args._callValue.eq(callValue), 'event.args.callValue')
      assert.equal(
        guardianExecTx.event.args._functionSignature,
        _lib.keccak256(web3.utils.utf8ToHex(functionSignature)),
        'event.args.functionSignature'
      )
      assert.equal(
        guardianExecTx.event.args._callData,
        _lib.keccak256(callData),
        'event.args.callData'
      )
      assert.equal(guardianExecTx.event.args._returnData, returnData, 'event.args.returnData')

      // Confirm Slash action succeeded by checking new Stake + Token values
      const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(
        finalStakeAcct2.eq(defaultStakeAmount.sub(slashAmount))
      )
      assert.isTrue(
        (initialTotalStake.sub(slashAmount)).eq(await staking.totalStaked()),
        'Expected same total stake amount'
      )
      assert.isTrue(
        (await token.totalSupply()).eq(initialTokenSupply.sub(slashAmount)),
        "Expected same token total supply"
      )
    })

    it('Fail to execute transaction on unregistered targetContract', async () => {
      const invalidRegistryKey = web3.utils.utf8ToHex('invalidRegistryKey')

      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          invalidRegistryKey,
          callValue,
          functionSignature,
          callData,
          { from: guardianAddress }
        ),
        "_targetContractRegistryKey must point to valid registered contract"
      )
    })

    it('Fail to execute transaction with no functionSignature', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          targetContractRegistryKey,
          callValue,
          '',
          callData,
          { from: guardianAddress }
        ),
        "_functionSignature cannot be empty."
      )
    })

    it('Upgrade contract', async () => {
      // Confirm staking.newFunction() not callable before upgrade
      const stakingCopy = await StakingUpgraded.at(staking.address)
      await _lib.assertRevert(stakingCopy.newFunction.call({ from: proxyDeployerAddress }), 'revert')
  
      // Deploy new logic contract to later upgrade to
      const stakingUpgraded0 = await StakingUpgraded.new({ from: proxyDeployerAddress })
      
      // Execute tx to upgrade
      await governance.guardianExecuteTransaction(
        stakingProxyKey,
        callValue0,
        'upgradeTo(address)',
        _lib.abiEncode(['address'], [stakingUpgraded0.address]),
        { from: guardianAddress }
      )

      // Confirm that contract was upgraded by ensuring staking.newFunction() call succeeds
      const stakingCopy2 = await StakingUpgraded.at(staking.address)
      const newFnResp = await stakingCopy2.newFunction.call({ from: proxyDeployerAddress })
      assert.equal(newFnResp, 5)

      // Confirm that proxy contract's implementation address has upgraded
      assert.equal(
        await stakingProxy.implementation.call({ from: proxyAdminAddress }),
        stakingUpgraded0.address,
        'Expected updated proxy implementation address'
      )
    })

    it('Update proxy admin address', async () => {
      let stakingProxy = await AudiusAdminUpgradeabilityProxy.at(staking.address)
      let currentAdmin = await stakingProxy.getAudiusProxyAdminAddress()
      assert.equal(currentAdmin, governance.address, 'Expect governance to be admin')
      let newAdmin = accounts[9]

      // Execute tx to change admin
      // NOTE - In reality, this function should rarely if ever be invoked from governance
      //        After migrations, all contract admins are ALREADY governance
      await governance.guardianExecuteTransaction(
        stakingProxyKey,
        callValue0,
        'setAudiusProxyAdminAddress(address)',
        _lib.abiEncode(['address'], [newAdmin]),
        { from: guardianAddress }
      )
      currentAdmin = await stakingProxy.getAudiusProxyAdminAddress()
      assert.equal(currentAdmin, newAdmin, 'Expect updated admin')
    })

    it('Upgrade governance contract', async () => {
      // Confirm governance.newFunction() not callable before upgrade
      const governanceCopy = await GovernanceUpgraded.at(governance.address)
      await _lib.assertRevert(governanceCopy.newFunction.call({ from: proxyDeployerAddress }), 'revert')

      // Deploy new logic contract to later upgrade to
      const governanceUpgraded0 = await GovernanceUpgraded.new({ from: proxyDeployerAddress })

      // Execute tx to upgrade
      await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'upgradeTo(address)',
        _lib.abiEncode(['address'], [governanceUpgraded0.address]),
        { from: guardianAddress }
      )

      // Confirm governance.newFunction() is callable after upgrade
      const governanceCopy2 = await GovernanceUpgraded.at(governance.address)
      const isGovernanceAddress = await governanceCopy2.isGovernanceAddress.call({ from:  proxyDeployerAddress })
      assert.isTrue(isGovernanceAddress, "Contract should identity self as governance")
      const newFnResp = await governanceCopy2.newFunction.call({ from: proxyDeployerAddress })
      assert.equal(newFnResp, 5)

      // Confirm that proxy contract's implementation address has upgraded
      const govProxy = await AudiusAdminUpgradeabilityProxy.at(governance.address)
      assert.equal(
        await govProxy.implementation.call({ from: proxyAdminAddress }),
        governanceUpgraded0.address,
        'Expected updated proxy implementation address'
      )
    })

    it('Transfer guardianship', async () => {
      const newGuardianAddress = accounts[19]
      const serviceVersion1 = web3.utils.utf8ToHex("0.0.1")
      const serviceVersion2 = web3.utils.utf8ToHex("0.0.2")

      // Confirm current guardianAddress is active
      assert.equal(await governance.getGuardianAddress(), guardianAddress, 'Expected same guardianAddress')
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue0,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testDiscProvType, serviceVersion1]),
        { from: guardianAddress }
      )

      // Confirm new guardianAddress not yet active
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue0,
          'setServiceVersion(bytes32,bytes32)',
          _lib.abiEncode(['bytes32', 'bytes32'], [testDiscProvType, serviceVersion2]),
          { from: newGuardianAddress }
        ),
        "Only guardian."
      )
      
      // Confirm only current guardianAddress can transfer guardianship
      await _lib.assertRevert(
        governance.transferGuardianship(newGuardianAddress, { from: accounts[18] }),
        "Only guardian."
      )
      
      // Update guardianAddress
      let transferGuardianshipTx = await governance.transferGuardianship(newGuardianAddress, { from: guardianAddress })

      // Confirm event log
      transferGuardianshipTx = _lib.parseTx(transferGuardianshipTx)
      assert.equal(transferGuardianshipTx.event.args._newGuardianAddress, newGuardianAddress, 'Expected newGuardianAddress')

      // Confirm new guardianAddress
      assert.equal(await governance.getGuardianAddress(), newGuardianAddress, 'Expected same guardianAddress')

      // Confirm old guardianAddress inactive
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue0,
          'setServiceVersion(bytes32,bytes32)',
          _lib.abiEncode(['bytes32', 'bytes32'], [testDiscProvType, serviceVersion2]),
          { from: guardianAddress }
        ),
        "Only guardian."
      )

      // Confirm new guardianAddress is now active
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue0,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testDiscProvType, serviceVersion2]),
        { from: newGuardianAddress }
      )
    })

    it('Update voting period', async () => {
      const newVotingPeriod = 15
      assert.equal(
        await governance.getVotingPeriod(),
        votingPeriod,
        "Incorrect expected voting period before update"
      )

      await _lib.assertRevert(
        governance.setVotingPeriod(newVotingPeriod),
        "Only callable by self"
      )

      // should revert if attempting to set voting period to zero
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          governanceKey,
          callValue0,
          'setVotingPeriod(uint256)',
          _lib.abiEncode(['uint256'], [0]),
          { from: guardianAddress }
        ),
        "Transaction failed."
      )
      
      let tx = await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setVotingPeriod(uint256)',
        _lib.abiEncode(['uint256'], [newVotingPeriod]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        tx.tx,
        Governance,
        'VotingPeriodUpdated',
        { _newVotingPeriod: _lib.toBN(newVotingPeriod) }
      )

      assert.equal(
        await governance.getVotingPeriod(),
        newVotingPeriod,
        "Incorrect expected voting period after update"
      )

      // set original value
      await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setVotingPeriod(uint256)',
        _lib.abiEncode(['uint256'], [votingPeriod]),
        { from: guardianAddress }
      )
    })

    it('Update voting quorum percent', async () => {
      const newVotingQuorumPercent = 20
      assert.equal(
        await governance.getVotingQuorumPercent(),
        votingQuorumPercent,
        "Incorrect expected votingQuorumPercent before update"
      )

      await _lib.assertRevert(
        governance.setVotingQuorumPercent(newVotingQuorumPercent),
        "Only callable by self"
      )
      
      // should revert if attempting to set voting quorum % to zero
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          governanceKey,
          callValue0,
          'setVotingQuorumPercent(uint256)',
          _lib.abiEncode(['uint256'], [0]),
          { from: guardianAddress }
        ),
        "Transaction failed."
      )
      // should revert if attempting to set voting quorum % > 100
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          governanceKey,
          callValue0,
          'setVotingQuorumPercent(uint256)',
          _lib.abiEncode(['uint256'], [120]),
          { from: guardianAddress }
        ),
        "Transaction failed."
      )

      let tx = await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setVotingQuorumPercent(uint256)',
        _lib.abiEncode(['uint256'], [newVotingQuorumPercent]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        tx.tx,
        Governance,
        'VotingQuorumPercentUpdated',
        { _newVotingQuorumPercent: _lib.toBN(newVotingQuorumPercent) }
      )
      assert.equal(
        await governance.getVotingQuorumPercent(),
        newVotingQuorumPercent,
        "Incorrect expected votingQuorumPercent after update"
      )
      // set original value
      await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setVotingQuorumPercent(uint256)',
        _lib.abiEncode(['uint256'], [votingQuorumPercent]),
        { from: guardianAddress }
      )
    })

    it('Update maxInProgressProposals', async () => {
      const newMaxInProgressProposals = maxInProgressProposals * 2

      assert.equal(
        await governance.getMaxInProgressProposals.call(),
        maxInProgressProposals,
        'Incorrect maxInProgressProposals value before update'
      )
      
      await _lib.assertRevert(
        governance.setMaxInProgressProposals(newMaxInProgressProposals),
        "Only callable by self"
      )

      // should fail to call setMaxInProgressProposals with invalid value of 0 
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          governanceKey,
          callValue0,
          'setMaxInProgressProposals(uint16)',
          _lib.abiEncode(['uint16'], [0]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )

      let tx = await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setMaxInProgressProposals(uint16)',
        _lib.abiEncode(['uint16'], [newMaxInProgressProposals]),
        { from: guardianAddress }
      )

      await expectEvent.inTransaction(
        tx.tx,
        Governance,
        'MaxInProgressProposalsUpdated',
        { _newMaxInProgressProposals: _lib.toBN(newMaxInProgressProposals) }
      )

      assert.equal(
        await governance.getMaxInProgressProposals.call(),
        newMaxInProgressProposals,
        'Incorrect maxInProgressProposals value after update'
      )
    })

    it('Get/Set executionDelay', async () => {
      const newExecutionDelay = executionDelay * 2
      assert.equal(
        await governance.getExecutionDelay.call(),
        executionDelay,
        "Incorrect executionDelay value before update"
      )
      await _lib.assertRevert(
        governance.setExecutionDelay(newExecutionDelay),
        "Only callable by self"
      )
      let tx = await governance.guardianExecuteTransaction(
        governanceKey,
        callValue0,
        'setExecutionDelay(uint256)',
        _lib.abiEncode(['uint256'], [newExecutionDelay]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        tx.tx,
        Governance,
        'ExecutionDelayUpdated',
        { _newExecutionDelay: _lib.toBN(newExecutionDelay) }
      )
      assert.equal(
        await governance.getExecutionDelay.call(),
        newExecutionDelay,
        "Incorrect executionDelay value after update"
      )
    })
  })

  describe('Token governance', async () => {
    it('Perform token actions via governance', async () => {
      // Ensure proxyDeployer no longer has any control over token
      await _lib.assertRevert(
        token.mint(proxyDeployerAddress, 1000, { from: proxyDeployerAddress }),
        "MinterRole: caller does not have the Minter role"
      )

      // Successfully mint tokens via governance
      await governance.guardianExecuteTransaction(
        tokenRegKey,
        callValue0,
        'mint(address,uint256)',
        _lib.abiEncode(['address', 'uint256'], [governance.address, 1000]),
        { from: guardianAddress }
      )
    })

    it.skip('TODO - Upgrade token', async () => {
      // Confirm implementation address points to current token
      assert.equal(
        await tokenProxy.implementation.call({ from: proxyAdminAddress }),
        token0.address
      )

      // Deploy new token contract to later upgrade to
      const tokenUpgraded0 = await AudiusToken.new({ from: proxyDeployerAddress })

      // Ensure proxyAdminAddress no longer has any ability to upgrade
      await _lib.assertRevert(
        tokenProxy.upgradeTo(tokenUpgraded0.address, { from: proxyAdminAddress }),
        "Caller must be current proxy governance address"
      )

      // Successfully upgrade token via governance
      await governance.guardianExecuteTransaction(
        tokenRegKey,
        callValue0,
        'upgradeTo(address)',
        _lib.abiEncode(['address'], [tokenUpgraded0.address]),
        { from: guardianAddress }
      )

      // Confirm implementation address points to new token
      assert.equal(
        await tokenProxy.implementation.call({ from: proxyAdminAddress }),
        tokenUpgraded0.address
      )
    })
  })

  describe('Registry governance', async () => {
    beforeEach(async () => {
      // Register registry to enable governance
      await registry.addContract(registryRegKey, registry.address, { from: proxyDeployerAddress })
    })

    it('Modify registry via governance', async () => {
      const contractRegKey = web3.utils.utf8ToHex('TestContract')

      // Confirm test contract is not yet registered
      assert.equal(await registry.getContract.call(contractRegKey), _lib.addressZero)
      
      // Deploy test contract to register
      const contract0 = await TestContract.new({ from: proxyDeployerAddress })
      const initData = _lib.encodeCall('initialize', [], [])
      const contractProxy = await AudiusAdminUpgradeabilityProxy.new(
        contract0.address,
        governance.address,
        initData,
        { from: proxyDeployerAddress }
      )
      const contract = await TestContract.at(contractProxy.address)

      // Confirm registration via governance fails since governance is not yet registry owner
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          registryRegKey,
          callValue0,
          'addContract(bytes32,address)',
          _lib.abiEncode(['bytes32', 'address'], [contractRegKey, contract.address]),
          { from: guardianAddress }
        ),
        "Transaction failed."
      )

      // Transfer registry ownership to Governance
      await registry.transferOwnership(governance.address, { from: proxyDeployerAddress })

      // Successfully register test contract via governance
      await governance.guardianExecuteTransaction(
        registryRegKey,
        callValue0,
        'addContract(bytes32,address)',
        _lib.abiEncode(['bytes32', 'address'], [contractRegKey, contract.address]),
        { from: guardianAddress }
      )

      // Confirm test contract is now registered
      assert.equal(await registry.getContract.call(contractRegKey), contract.address)
    })

    it('Upgrade registry', async () => {
      // Confirm implementation address points to current registry
      assert.equal(
        await registryProxy.implementation.call({ from: proxyAdminAddress }),
        registry0.address
      )

      // Deploy new logic contract to later upgrade to
      const registryUpgraded0 = await Registry.new({ from: proxyDeployerAddress })

      // Fail to upgrade via governance since registry's governance address has not been set
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          registryRegKey,
          callValue0,
          'upgradeTo(address)',
          _lib.abiEncode(['address'], [registryUpgraded0.address]),
          { from: guardianAddress }
        ),
        "Transaction failed."
      )

      // Update registry's governance address
      await registryProxy.setAudiusProxyAdminAddress(governance.address, { from: proxyAdminAddress })

      // Upgrade registry proxy to new logic address
      await governance.guardianExecuteTransaction(
        registryRegKey,
        callValue0,
        'upgradeTo(address)',
        _lib.abiEncode(['address'], [registryUpgraded0.address]),
        { from: guardianAddress }
      )

      // Confirm implementation address points to new registry
      assert.equal(
        await registryProxy.implementation.call({ from: proxyAdminAddress }),
        registryUpgraded0.address
      )

      // Confirm interaction still works & state was preserved
      assert.equal(await registry.getContract.call(registryRegKey), registryProxy.address)
    })
  })
})
