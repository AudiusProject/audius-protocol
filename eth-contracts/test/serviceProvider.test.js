import * as _lib from '../utils/lib.js'
const { time, expectEvent } = require('@openzeppelin/test-helpers')

const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ClaimsManager = artifacts.require('ClaimsManager')
const MockDelegateManager = artifacts.require('MockDelegateManager')
const GovernanceUpgraded = artifacts.require('GovernanceUpgraded')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')

const testDiscProvType = web3.utils.utf8ToHex('discovery-node')
const testContentNodeType = web3.utils.utf8ToHex('content-node')
const testInvalidType = web3.utils.utf8ToHex('invalid-type')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'
const testEndpoint2 = 'https://localhost:5002'

const MIN_STAKE_AMOUNT = 10
const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10
const DECREASE_STAKE_LOCKUP_DURATION = VOTING_PERIOD + EXECUTION_DELAY + 1
const DEPLOYER_CUT_LOCKUP_DURATION = 11

const INITIAL_BAL = _lib.audToWeiBN(1000)
const DEFAULT_AMOUNT = _lib.audToWeiBN(120)


contract('ServiceProvider test', async (accounts) => {
  let token, registry, staking0, stakingInitializeData, proxy, claimsManager, governance
  let staking, serviceProviderFactory, serviceTypeManager, mockDelegateManager

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress, fakeGovernanceAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress
  const stakerAccount = accounts[11]
  const stakerAccount2 = accounts[12]
  const stakerAccount3 = accounts[13]
  const callValue = _lib.toBN(0)
  const cnTypeMin = _lib.audToWei(10)
  const cnTypeMax = _lib.audToWei(10000000)
  const dpTypeMin = _lib.audToWei(4)
  const dpTypeMax = _lib.audToWei(10000000)

  /* Helper functions */

  const increaseRegisteredProviderStake = async (increase, account) => {
    // Approve token transfer
    await token.approve(
      staking.address,
      increase,
      { from: account }
    )

    const tx = await serviceProviderFactory.increaseStake(
      increase,
      { from: account }
    )

    let currentlyStakedForAccount = await staking.totalStakedFor(account)

    await expectEvent.inTransaction(
      tx.tx,
      ServiceProviderFactory,
      'IncreasedStake',
      {
        _owner: account,
        _increaseAmount: increase,
        _newStakeAmount: currentlyStakedForAccount
      }
    )
  }

  const getStakeAmountForAccount = async (account) => staking.totalStakedFor(account)

  const decreaseRegisteredProviderStake = async (decrease, account, cancelRequest = false) => {
    if(!web3.utils.isBN(decrease)) {
      decrease = web3.utils.toBN(decrease)
    }
    // Request decrease in stake
    let tx = await serviceProviderFactory.requestDecreaseStake(decrease, { from: account })
    let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(account)
    await expectEvent.inTransaction(
      tx.tx,
      ServiceProviderFactory,
      'DecreaseStakeRequested',
      {
        _owner: account,
        _decreaseAmount: decrease,
        _lockupExpiryBlock: requestInfo.lockupExpiryBlock
      }
    )

    if (cancelRequest) {
      tx = await serviceProviderFactory.cancelDecreaseStakeRequest(account, { from: account })
      await expectEvent.inTransaction(
        tx.tx,
        ServiceProviderFactory,
        'DecreaseStakeRequestCancelled',
        {
          _owner: account,
          _decreaseAmount: decrease,
          _lockupExpiryBlock: requestInfo.lockupExpiryBlock
        }
      )
      requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(account)
      assert.isTrue(requestInfo.lockupExpiryBlock.eq(_lib.toBN(0)), "Expect reset of lockup expiry block")
      assert.isTrue(requestInfo.amount.eq(_lib.toBN(0)), "Expect reset of decrease amt")
      return
    }

    // Advance to valid block
    await time.advanceBlockTo(requestInfo.lockupExpiryBlock)

    // Approve token transfer from staking contract to account
    tx = await serviceProviderFactory.decreaseStake({ from: account })
    await expectEvent.inTransaction(
      tx.tx,
      ServiceProviderFactory,
      'DecreaseStakeRequestEvaluated',
      {
        _owner: account,
        _decreaseAmount: decrease,
        _newStakeAmount: (await staking.totalStakedFor(account))
      }
    )
  }

  const getServiceProviderIdsFromAddress = async (account, type) => {
    return serviceProviderFactory.getServiceProviderIdsFromAddress(account, type)
  }

  const serviceProviderIDRegisteredToAccount = async (account, type, id) => {
    const ids = await getServiceProviderIdsFromAddress(account, type)
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].eq(id)) { return true }
    }
    return false
  }

  /**
   * Initialize Registry, Governance, Token, Staking, ServiceTypeManager, ClaimsManager, ServiceProviderFactory
   * Deploy MockDelegateManager for processClaim
   * add service types content-node and discovery-node
   * Transfer 1000 tokens to accounts[11]
   */
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

    // Deploy + register Staking
    staking0 = await Staking.new({ from: proxyDeployerAddress })
    stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [
        token.address,
        governance.address
      ]
    )
    proxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      governance.address,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(proxy.address)
    await registry.addContract(stakingProxyKey, proxy.address, { from: proxyDeployerAddress })

    // Deploy + register ServiceTypeManager
    let serviceTypeInitializeData = _lib.encodeCall(
      'initialize', ['address'], [governance.address]
    )
    let serviceTypeManager0 = await ServiceTypeManager.new({ from: proxyDeployerAddress })
    let serviceTypeManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      governance.address,
      serviceTypeInitializeData,
      { from: proxyAdminAddress }
    )
    serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManager.address, { from: proxyDeployerAddress })

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
    // End claims manager setup

    // Deploy mock delegate manager with only function to forward processClaim call
    mockDelegateManager = await MockDelegateManager.new()
    await mockDelegateManager.initialize(claimsManager.address)
    await registry.addContract(delegateManagerKey, mockDelegateManager.address, { from: proxyDeployerAddress })

    /** addServiceTypes content-node and discovery-node via Governance */
    let addServiceTx = await _lib.addServiceType(testContentNodeType, cnTypeMin, cnTypeMax, governance, guardianAddress, serviceTypeManagerProxyKey)
    /*
     * Padding is required to handle event formatting of bytes32 type:
     * from event:      0x63726561746f722d6e6f64650000000000000000000000000000000000000000
     * without padding: 0x63726561746f722d6e6f6465
     */
    await expectEvent.inTransaction(
      addServiceTx.tx, ServiceTypeManager, 'ServiceTypeAdded',
      { _serviceType: web3.utils.padRight(testContentNodeType, 64),
        _serviceTypeMin: cnTypeMin,
        _serviceTypeMax: cnTypeMax
      }
    )

    const serviceTypeCNInfo = await serviceTypeManager.getServiceTypeInfo.call(testContentNodeType)
    assert.isTrue(serviceTypeCNInfo.isValid, 'Expected serviceTypeCN isValid')
    assert.isTrue(serviceTypeCNInfo.minStake.eq(_lib.toBN(cnTypeMin)), 'Expected same minStake')
    assert.isTrue(serviceTypeCNInfo.maxStake.eq(_lib.toBN(cnTypeMax)), 'Expected same maxStake')

    await _lib.addServiceType(testDiscProvType, dpTypeMin, dpTypeMax, governance, guardianAddress, serviceTypeManagerProxyKey)
    const serviceTypeDPInfo = await serviceTypeManager.getServiceTypeInfo.call(testDiscProvType)
    assert.isTrue(serviceTypeDPInfo.isValid, 'Expected serviceTypeDP isValid')
    assert.isTrue(serviceTypeDPInfo.minStake.eq(_lib.toBN(dpTypeMin)), 'Expected same minStake')
    assert.isTrue(serviceTypeDPInfo.maxStake.eq(_lib.toBN(dpTypeMax)), 'Expected same maxStake')

    // Deploy + register ServiceProviderFactory
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
      { from: proxyAdminAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: proxyDeployerAddress })

    // Transfer 1000 tokens to accounts[11]
    await token.transfer(accounts[11], INITIAL_BAL, { from: proxyDeployerAddress })

    // ---- Configuring addresses
    await _lib.configureGovernanceContractAddresses(
      governance,
      governanceKey,
      guardianAddress,
      staking.address,
      serviceProviderFactory.address,
      mockDelegateManager.address
    )
    // ---- Set up staking contract permissions
    await _lib.configureStakingContractAddresses(
      governance,
      guardianAddress,
      stakingProxyKey,
      staking,
      serviceProviderFactoryProxy.address,
      claimsManager.address,
      _lib.addressZero
    )
    // ---- Set up claims manager contract permissions
    await _lib.configureClaimsManagerContractAddresses(
      governance,
      guardianAddress,
      claimsManagerProxyKey,
      claimsManager,
      staking.address,
      serviceProviderFactory.address,
      _lib.addressZero
    )

    await _lib.assertRevert(
      _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount
      ),
      'stakingAddress is not set'
    )

    await _lib.assertRevert(
      serviceProviderFactory.updateServiceProviderStake(
        stakerAccount,
        _lib.toBN(200)
      ),
      'stakingAddress is not set')

    let initTxs = await _lib.configureServiceProviderFactoryAddresses(
      governance,
      guardianAddress,
      serviceProviderFactoryKey,
      serviceProviderFactory,
      staking.address,
      serviceTypeManagerProxy.address,
      claimsManager.address,
      mockDelegateManager.address
    )

    await expectEvent.inTransaction(
      initTxs.stakingTx.tx,
      ServiceProviderFactory,
      'StakingAddressUpdated',
      { _newStakingAddress: staking.address }
    )
    await expectEvent.inTransaction(
      initTxs.serviceTypeTx.tx,
      ServiceProviderFactory,
      'ServiceTypeManagerAddressUpdated',
      { _newServiceTypeManagerAddress: serviceTypeManagerProxy.address }
    )
    await expectEvent.inTransaction(
      initTxs.delegateManagerTx.tx,
      ServiceProviderFactory,
      'DelegateManagerAddressUpdated',
      { _newDelegateManagerAddress: mockDelegateManager.address }
    )
    await expectEvent.inTransaction(
      initTxs.claimsManagerTx.tx,
      ServiceProviderFactory,
      'ClaimsManagerAddressUpdated',
      { _newClaimsManagerAddress: claimsManager.address }
    )
  })

  describe('Registration flow', () => {
    let regTx

    /**
     * Register serviceProvider of testDiscProvType + confirm initial state
     */
    beforeEach(async () => {
      const initialBal = await token.balanceOf(stakerAccount, { from: proxyDeployerAddress })

      regTx = await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount
      )
      // Confirm event has correct amount
      assert.isTrue(regTx.stakeAmount.eq(DEFAULT_AMOUNT))

      const numProviders = await serviceProviderFactory.getTotalServiceTypeProviders(testDiscProvType)
      assert.isTrue(numProviders.eq(web3.utils.toBN(1)), 'Expect 1 for test disc prov type')

      const spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue(spDetails.numberOfEndpoints.eq(web3.utils.toBN(1)), 'Expect 1 endpoint registered')

      // Confirm balance updated for tokens
      const finalBal = await token.balanceOf(stakerAccount)
      assert.isTrue(initialBal.eq(finalBal.add(DEFAULT_AMOUNT)), 'Expect funds to be transferred')

      const newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        regTx.spID
      )
      assert.isTrue(
        newIdFound,
        'Expected to find newly registered ID associated with this account'
      )

      assert.isTrue(
        (await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT),
        'Expected default stake amount'
      )

      // Validate serviceType info
      const serviceTypeDPInfo = await serviceTypeManager.getServiceTypeInfo(testDiscProvType)
      assert.isTrue(serviceTypeDPInfo.minStake.eq(spDetails.minAccountStake), 'Expected serviceTypeDP minStake == sp 1 minAccountStake')
      assert.isTrue(serviceTypeDPInfo.maxStake.eq(spDetails.maxAccountStake), 'Expected serviceTypeDP maxStake == sp 1 maxAccountStake')
    })

    it('Confirm initial decreaseStakeLockupDuration', async () => {
      const decreaseStakeLockupDuration = await serviceProviderFactory.getDecreaseStakeLockupDuration.call()
      assert.equal(
        _lib.fromBN(decreaseStakeLockupDuration),
        DECREASE_STAKE_LOCKUP_DURATION,
        'Expected same decreaseStakeLockupDuration'
      )
    })

    it('Confirm correct stake for account', async () => {
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))
    })

    it('Fail to register invalid type', async () => {
      // Confirm invalid type cannot be registered
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testInvalidType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount
        ),
        'Valid service type required'
      )
    })

    it('Fail to add serviceType with invalid bounds', async () => {
      const testOtherType = web3.utils.utf8ToHex('other')
      
      // Register with zero maxbounds fails
      await _lib.assertRevert(
        _lib.addServiceType(testOtherType, _lib.audToWei(4), _lib.audToWei(0), governance, guardianAddress, serviceTypeManagerProxyKey)
        /* Cannot check revert msg bc call is made via governance */
      )

      // Register with max stake <= min stake fails
      await _lib.assertRevert(
        _lib.addServiceType(testOtherType, _lib.audToWei(4), _lib.audToWei(2), governance, guardianAddress, serviceTypeManagerProxyKey)
        /* Cannot check revert msg bc call is made via governance */
      )

      // Register with zero min and maxbounds fails
      await _lib.assertRevert(
        _lib.addServiceType(testOtherType, _lib.audToWei(0), _lib.audToWei(0), governance, guardianAddress, serviceTypeManagerProxyKey)
        /* Cannot check revert msg bc call is made via governance */
      )
    })

    it('Deregister endpoint and confirm transfer of staking balance to owner', async () => {
      // Confirm staking contract has correct amt
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))

      // Confirm unregistered endpoint cannot be deregistered
      await _lib.assertRevert(
        _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testDiscProvType,
          'http://localhost:1000',
          stakerAccount),
        'Endpoint not registered'
      )

      await _lib.assertRevert(
        _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          accounts[5]
        ),
        'Only callable by endpoint owner'
      )

      // Deregister 4th service provider
      let deregTx = await _lib.deregisterServiceProvider(
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
      assert.isTrue(deregTx.spID.eq(regTx.spID))
      assert.isTrue(deregTx.unstakeAmount.eq(DEFAULT_AMOUNT))
      // Confirm no stake is remaining in staking contract
      assert.isTrue((await staking.totalStakedFor(stakerAccount)).isZero())
      // Test 3
      assert.isTrue(
        (await token.balanceOf(stakerAccount)).eq(INITIAL_BAL),
        'Expect full amount returned to staker after deregistering'
      )
    })

    it('Min deployer stake violation', async () => {
      const dpTypeInfo = await serviceTypeManager.getServiceTypeInfo(testDiscProvType)
      // Calculate an invalid direct stake amount
      let invalidStakeAmount = dpTypeInfo.minStake.sub(_lib.toBN(1))
      await token.transfer(stakerAccount2, invalidStakeAmount, { from: proxyDeployerAddress })

      // Validate that this value won't violate service type minimum
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint1,
          invalidStakeAmount,
          stakerAccount2),
        'Minimum stake requirement not met'
      )
    })

    it('Update service provider cut', async () => {
      let updatedCutValue = 10
      // Permission of request to input account
      await _lib.assertRevert(
        serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, updatedCutValue, { from: accounts[4] }),
        'Only callable by Service Provider or Governance'
      )
      // Eval fails if no pending operation
      await _lib.assertRevert(
        serviceProviderFactory.updateDeployerCut(
          stakerAccount,
          { from: accounts[4] }),
        'No update deployer cut operation pending'
      )

      await _lib.assertRevert(
        serviceProviderFactory.cancelUpdateDeployerCut(stakerAccount),
        'No update deployer cut operation pending'
      )

      let deployerCutUpdateDuration = await serviceProviderFactory.getDeployerCutLockupDuration()
      let requestTx = await serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, updatedCutValue, { from: stakerAccount })
      let requestBlock = _lib.toBN(requestTx.receipt.blockNumber)
      let expectedExpiryBlock = requestBlock.add(deployerCutUpdateDuration)
      await expectEvent.inTransaction(
        requestTx.tx,
        ServiceProviderFactory,
        'DeployerCutUpdateRequested',
        {
          _owner: stakerAccount,
          _updatedCut: _lib.toBN(updatedCutValue),
          _lockupExpiryBlock: expectedExpiryBlock
        }
      )

      // Retrieve pending info
      let pendingOp = await serviceProviderFactory.getPendingUpdateDeployerCutRequest(stakerAccount)
      assert.isTrue(
        (expectedExpiryBlock).eq(pendingOp.lockupExpiryBlock),
        'Unexpected expiry block'
      )

      await _lib.assertRevert(
        serviceProviderFactory.updateDeployerCut(
          stakerAccount,
          { from: stakerAccount }
        ),
        'Lockup must be expired'
      )

      await time.advanceBlockTo(pendingOp.lockupExpiryBlock)

      let updateTx = await serviceProviderFactory.updateDeployerCut(
        stakerAccount,
        { from: stakerAccount }
      )

      await expectEvent.inTransaction(
        updateTx.tx,
        ServiceProviderFactory,
        'DeployerCutUpdateRequestEvaluated',
        { _owner: stakerAccount,
          _updatedCut: `${updatedCutValue}`
        }
      )
      let info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(updatedCutValue)), 'Expect updated cut')

      // Reset the value for updated cut to 0
      updatedCutValue = 0
      requestTx = await serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, updatedCutValue, { from: stakerAccount })
      pendingOp = await serviceProviderFactory.getPendingUpdateDeployerCutRequest(stakerAccount)
      await time.advanceBlockTo(pendingOp.lockupExpiryBlock)
      updateTx = await serviceProviderFactory.updateDeployerCut(stakerAccount, { from: stakerAccount })
      info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(updatedCutValue)), 'Expect updated cut')

      // Confirm cancellation works
      let preUpdatecut = updatedCutValue
      updatedCutValue = 10
      // Submit request
      requestTx = await serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, updatedCutValue, { from: stakerAccount })
      // Confirm request status
      pendingOp = await serviceProviderFactory.getPendingUpdateDeployerCutRequest(stakerAccount)
      assert.isTrue(pendingOp.newDeployerCut.eq(_lib.toBN(updatedCutValue)), 'Expect in flight request')
      assert.isTrue(!pendingOp.lockupExpiryBlock.eq(_lib.toBN(0)), 'Expect in flight request')
      // Submit cancellation
      let cancelTx = await serviceProviderFactory.cancelUpdateDeployerCut(stakerAccount, { from: stakerAccount })
      await expectEvent.inTransaction(
        cancelTx.tx,
        ServiceProviderFactory,
        'DeployerCutUpdateRequestCancelled',
        { _owner: stakerAccount,
          _requestedCut: _lib.toBN(updatedCutValue),
          _finalCut: _lib.toBN(preUpdatecut)
        }
      )
      // Confirm request status
      pendingOp = await serviceProviderFactory.getPendingUpdateDeployerCutRequest(stakerAccount)
      assert.isTrue(pendingOp.newDeployerCut.eq(_lib.toBN(0)), 'Expect cancelled request')
      assert.isTrue(pendingOp.lockupExpiryBlock.eq(_lib.toBN(0)), 'Expect cancelled request')
      // Confirm no change in deployer cut
      info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(preUpdatecut)), 'Expect updated cut')

      let invalidCut = 110
      let base = await serviceProviderFactory.getServiceProviderDeployerCutBase()
      assert.isTrue(_lib.toBN(invalidCut).gt(base), 'Expect invalid newCut')
      await _lib.assertRevert(
        serviceProviderFactory.requestUpdateDeployerCut(stakerAccount, invalidCut, { from: stakerAccount }),
        'Service Provider cut cannot exceed base value')

      // Set an invalid value for lockup
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceProviderFactoryKey,
          callValue,
          'updateDeployerCutLockupDuration(uint256)',
          _lib.abiEncode(['uint256'], [1]),
          { from: guardianAddress }
        )
      )

      let validUpdatedDuration = DEPLOYER_CUT_LOCKUP_DURATION + 1
      await governance.guardianExecuteTransaction(
        serviceProviderFactoryKey,
        callValue,
        'updateDeployerCutLockupDuration(uint256)',
        _lib.abiEncode(['uint256'], [validUpdatedDuration]),
        { from: guardianAddress }
      )
      let fromChainDuration = await serviceProviderFactory.getDeployerCutLockupDuration()
      assert.isTrue(fromChainDuration.eq(_lib.toBN(validUpdatedDuration)), 'Expected update')
    })

    it('Fails to register duplicate endpoint w/same account', async () => {
      // Attempt to register dup endpoint with the same account
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount
        ),
        'Endpoint already registered'
      )
    })

    it('Attempt to register first endpoint with zero stake, expect error', async () => {
      await token.transfer(
        stakerAccount2,
        MIN_STAKE_AMOUNT - 1,
        { from: proxyDeployerAddress }
      )

      // Attempt to register first endpoint with zero stake
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint1,
          MIN_STAKE_AMOUNT - 1,
          stakerAccount2
        ),
        'Minimum stake requirement not met'
      )
    })

    it('Fails to register endpoint w/zero stake', async () => {
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint1,
          0,
          stakerAccount2
        ),
        'Minimum stake requirement not met'
      )
    })

    it('Increases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))

      await _lib.assertRevert(
        increaseRegisteredProviderStake(_lib.audToWeiBN(10), accounts[4]),
        'Registered endpoint required to increase stake'
      )

      await increaseRegisteredProviderStake(
        DEFAULT_AMOUNT,
        stakerAccount
      )

      // Confirm increased amount in staking contract
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT.mul(_lib.toBN(2))))
    })

    it('Decreases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))

      const initialBal = await token.balanceOf(stakerAccount)
      const decreaseStakeAmount = DEFAULT_AMOUNT.div(_lib.toBN(2))

      // Subtraction overflow when subtracting decrease amount of 10 AUD from 0 balance
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(_lib.audToWeiBN(10), accounts[4]),
        'SafeMath: subtraction overflow'
      )

      await decreaseRegisteredProviderStake(decreaseStakeAmount, stakerAccount)

      // Confirm decreased amount in staking contract
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(decreaseStakeAmount))

      // Confirm balance
      assert.isTrue(
        (await token.balanceOf(stakerAccount)).eq(initialBal.add(decreaseStakeAmount)),
        'Expect increase in token balance after decreasing stake'
      )

      // Issue and cancel decrease stake request
      await decreaseRegisteredProviderStake(decreaseStakeAmount, stakerAccount, true)
    })

    it('Fails to decrease more than staked', async () => {
      // Confirm initial amount in staking contract
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))

      let decreaseStakeAmount = DEFAULT_AMOUNT + 2
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(decreaseStakeAmount, stakerAccount)
      )
    })

    it('Fails to decrease stake to zero without deregistering SPs', async () => {
      // Confirm initial amount in staking contract
      const initialStake = await staking.totalStakedFor(stakerAccount)
      assert.isTrue(initialStake.eq(DEFAULT_AMOUNT))

      // TODO - Confirm this is the right behavior?
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          initialStake,
          stakerAccount
        ),
        'Minimum stake requirement not met'
      )
    })

    it('Update delegateOwnerWallet & validate function restrictions', async () => {
      let spID = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint)
      let info = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spID)
      let currentDelegateOwnerWallet = info.delegateOwnerWallet

      assert.equal(
        stakerAccount,
        currentDelegateOwnerWallet,
        'Expect initial delegateOwnerWallet equal to registrant')
      // Confirm wrong owner update is rejected
      await _lib.assertRevert(
        serviceProviderFactory.updateDelegateOwnerWallet(
          testDiscProvType,
          testEndpoint,
          accounts[7],
          { from: accounts[8] }
        ),
        'Invalid update'
      )
      // Perform and validate update
      let newDelegateOwnerWallet = accounts[4]
      let updateWalletTx = await serviceProviderFactory.updateDelegateOwnerWallet(
        testDiscProvType,
        testEndpoint,
        newDelegateOwnerWallet,
        { from: stakerAccount })

      await expectEvent.inTransaction(
        updateWalletTx.tx, ServiceProviderFactory, 'DelegateOwnerWalletUpdated',
        { _serviceType: web3.utils.padRight(testDiscProvType, 64),
          _owner: stakerAccount,
          _updatedWallet: newDelegateOwnerWallet,
          _spID: spID
        }
      )

      info = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spID)
      let newDelegateFromChain = info.delegateOwnerWallet

      assert.equal(
        newDelegateOwnerWallet,
        newDelegateFromChain,
        'Expect updated delegateOwnerWallet equivalency')
    })

    /*
     * Register a new endpoint under the same account, adding stake to the account
     */
    it('Multiple endpoints w/same account, increase stake', async () => {
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      let registerInfo = await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint1,
        increaseAmt,
        stakerAccount
      )
      let newSPId = registerInfo.spID

      // Confirm change in token balance
      let finalBal = await token.balanceOf(stakerAccount)
      let finalStake = await getStakeAmountForAccount(stakerAccount)

      assert.equal(
        (initialBal - finalBal),
        increaseAmt,
        'Expected decrease in final balance')

      assert.equal(
        (finalStake - initialStake),
        increaseAmt,
        'Expected increase in total stake')

      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')
    })

    it('Multiple endpoints w/multiple accounts varying stake', async () => {
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      // 2nd endpoint for stakerAccount = https://localhost:5001
      // discovery-node
      // Total Stake = 240 AUD
      let registerInfo = await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint1,
        increaseAmt,
        stakerAccount)
      let newSPId = registerInfo.spID

      // Confirm change in token balance
      let finalBal = await token.balanceOf(stakerAccount)
      let finalStake = await getStakeAmountForAccount(stakerAccount)

      assert.equal(
        (initialBal - finalBal),
        increaseAmt,
        'Expected decrease in final balance')

      assert.equal(
        (finalStake - initialStake),
        increaseAmt,
        'Expected increase in total stake')

      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')

      // 3rd endpoint for stakerAccount
      // Transfer 1000 tokens to staker for test
      await token.transfer(stakerAccount, INITIAL_BAL, { from: proxyDeployerAddress })

      let stakedAmount = await staking.totalStakedFor(stakerAccount)
      let spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let accountMin = _lib.fromWei(spDetails.minAccountStake)
      let accountMax = _lib.fromWei(spDetails.maxAccountStake)

      let accountDiff = _lib.fromWei(stakedAmount) - accountMin

      await decreaseRegisteredProviderStake(_lib.audToWeiBN(accountDiff), stakerAccount)
      stakedAmount = await staking.totalStakedFor(stakerAccount)

      let testCnodeEndpoint1 = 'https://localhost:4000'
      let testCnodeEndpoint2 = 'https://localhost:4001'

      let cnTypeInfo = await serviceTypeManager.getServiceTypeInfo(testContentNodeType)
      let cnTypeMin = cnTypeInfo.minStake
      let cnTypeMax = cnTypeInfo.maxStake
      let dpTypeInfo = await serviceTypeManager.getServiceTypeInfo(testDiscProvType)
      let dpTypeMin = dpTypeInfo.minStake

      // Total Stake = 240 AUD <-- Expect failure
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testContentNodeType,
          testCnodeEndpoint1,
          0,
          stakerAccount),
        'Minimum stake requirement not met')

      // 3rd endpoint for stakerAccount = https://localhost:4001
      // content-node
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testContentNodeType,
        testCnodeEndpoint1,
        cnTypeMin,
        stakerAccount)

      let testDiscProvs = await getServiceProviderIdsFromAddress(stakerAccount, testDiscProvType)
      let testCnodes = await getServiceProviderIdsFromAddress(stakerAccount, testContentNodeType)
      let cnodeMinStake = cnTypeMin * testCnodes.length
      let dpMinStake = dpTypeMin * testDiscProvs.length

      stakedAmount = await staking.totalStakedFor(stakerAccount)
      assert.equal(stakedAmount, dpMinStake + cnodeMinStake, 'Expect min staked with total endpoints')

      spDetails = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      let stakedAmountWei = _lib.fromWei(stakedAmount)
      accountMin = _lib.fromWei(spDetails.minAccountStake)
      accountMax = _lib.fromWei(spDetails.maxAccountStake)
      assert.equal(stakedAmountWei, accountMin, 'Expect min staked with total endpoints')

      accountDiff = accountMax - stakedAmountWei
      // Generate BNjs value
      let transferAmount = web3.utils.toBN(accountDiff)
        .add(web3.utils.toBN(_lib.fromWei(cnTypeMax)))
        .add(web3.utils.toBN(200))

      // Transfer greater than max tokens
      await token.transfer(stakerAccount, _lib.audToWeiBN(transferAmount), { from: proxyDeployerAddress })

      // Attempt to register, expect max stake bounds to be exceeded
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testContentNodeType,
          testCnodeEndpoint2,
          _lib.audToWeiBN(transferAmount),
          stakerAccount),
        'Maximum stake'
      )

      let numCnodeEndpoints = await getServiceProviderIdsFromAddress(stakerAccount, testContentNodeType)

      // 4th endpoint for service provider
      // content-node
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testContentNodeType,
        testCnodeEndpoint2,
        cnTypeMin,
        stakerAccount)

      assert.equal(
        numCnodeEndpoints.length + 1,
        (await getServiceProviderIdsFromAddress(stakerAccount, testContentNodeType)).length,
        'Expect increase in number of endpoints')

      stakedAmount = await staking.totalStakedFor(stakerAccount)
      numCnodeEndpoints = await getServiceProviderIdsFromAddress(stakerAccount, testContentNodeType)

      // Confirm failure to deregister invalid endpoint and service type combination
      await _lib.assertRevert(
        _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testContentNodeType,
          testEndpoint,
          stakerAccount
        ),
        'Invalid endpoint for service type'
      )

      // Successfully deregister
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testContentNodeType,
        testCnodeEndpoint2,
        stakerAccount)
      assert.isTrue(stakedAmount.eq(await staking.totalStakedFor(stakerAccount)), 'Expect no stake change')
    })

    /*
     * Register a new endpoint under the same account, without adding stake to the account
     */
    it('Multiple endpoints w/same account, static stake', async () => {
      const initialBal = await token.balanceOf(stakerAccount)
      const registerInfo = await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testDiscProvType,
        testEndpoint1,
        0,
        stakerAccount
      )
      const newSPId = registerInfo.spID

      // Confirm change in token balance
      const finalBal = await token.balanceOf(stakerAccount)
      assert.isTrue(
        initialBal.sub(finalBal).isZero(),
        'Expected no change in final balance'
      )
      const newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        newSPId
      )
      assert.isTrue(newIdFound, 'Expected valid new ID')
    })

    it('Fail to update service provider stake', async () => {
      await _lib.assertRevert(
        serviceProviderFactory.updateServiceProviderStake(stakerAccount, _lib.audToWeiBN(10)),
        'only callable by DelegateManager')
    })

    it('Modify the dns endpoint for an existing service', async () => {
      const spId = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint)
      const { endpoint } = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spId)
      assert.equal(testEndpoint, endpoint)

      // update the endpoint from testEndpoint to testEndpoint1
      let updateEndpointTx = await serviceProviderFactory.updateEndpoint(testDiscProvType, testEndpoint, testEndpoint1, { from: stakerAccount })
      const { endpoint: endpointAfter } = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spId)
      assert.equal(testEndpoint1, endpointAfter)
      await expectEvent.inTransaction(
        updateEndpointTx.tx,
        ServiceProviderFactory,
        'EndpointUpdated',
        { _serviceType: web3.utils.padRight(testDiscProvType, 64),
          _owner: stakerAccount,
          _oldEndpoint: testEndpoint,
          _newEndpoint: testEndpoint1,
          _spID: spId
        }
      )

      // it should replace the service provider in place so spId should be consistent
      const spIdNew = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint1)
      assert.isTrue(spId.eq(spIdNew))
    })

    it('Fail to modify the dns endpoint for the wrong owner', async () => {
      // will try to update the endpoint from the incorrect account
      await _lib.assertRevert(
        serviceProviderFactory.updateEndpoint(testDiscProvType, testEndpoint, testEndpoint1),
        'Invalid update endpoint operation, wrong owner'
      )
    })

    it('Fail to modify the dns endpoint if the dns endpoint doesnt exist', async () => {
      // will try to update the endpoint from the incorrect account
      const fakeEndpoint = 'https://does.not.exist.com'
      await _lib.assertRevert(
        serviceProviderFactory.updateEndpoint(testDiscProvType, fakeEndpoint, testEndpoint1),
        'Could not find service provider with that endpoint'
      )
    })

    it('Fail to set service addresses from non-governance contract', async () => {
      await _lib.assertRevert(
        serviceProviderFactory.setGovernanceAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )
      await _lib.assertRevert(
        serviceProviderFactory.setStakingAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )

      await _lib.assertRevert(
        serviceProviderFactory.setDelegateManagerAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )

      await _lib.assertRevert(
        serviceProviderFactory.setServiceTypeManagerAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )

      await _lib.assertRevert(
        serviceProviderFactory.setClaimsManagerAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )
    })

    it('Will fail to set the new governance address if new contract is not a governance contract', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceProviderFactoryKey,
          callValue,
          'setGovernanceAddress(address)',
          _lib.abiEncode(['address'], [accounts[14]]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )
    })

    it('Will set the new governance address if called from current governance contract', async () => {
      const governanceUpgraded0 = await GovernanceUpgraded.new({ from: proxyDeployerAddress })
      const newGovernanceAddress = governanceUpgraded0.address

      assert.equal(
        governance.address,
        await serviceProviderFactory.getGovernanceAddress(),
        "expected governance address before changing"
      )
      let govTx = await governance.guardianExecuteTransaction(
        serviceProviderFactoryKey,
        callValue,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [newGovernanceAddress]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        govTx.tx,
        ServiceProviderFactory,
        'GovernanceAddressUpdated',
        { _newGovernanceAddress: newGovernanceAddress }
      )
      assert.equal(
        newGovernanceAddress,
        await serviceProviderFactory.getGovernanceAddress(),
        "updated governance addresses don't match"
      )
    })

    it('Claim pending and decrease stake restrictions', async () => {
      await claimsManager.initiateRound({ from: stakerAccount })
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount
        ),
        'No pending claim expected'
      )

      await _lib.assertRevert(
        serviceProviderFactory.requestDecreaseStake(0, { from: stakerAccount }),
        'Requested stake decrease amount must be greater than zero'
      )

      await _lib.assertRevert(
        serviceProviderFactory.requestDecreaseStake(
          DEFAULT_AMOUNT.div(_lib.toBN(2)),
          { from: stakerAccount }
        ),
        'No claim expected to be pending prior to stake transfer'
      )

      await _lib.assertRevert(
        serviceProviderFactory.decreaseStake({ from: stakerAccount }),
        'Decrease stake request must be pending'
      )

      await _lib.assertRevert(
        serviceProviderFactory.cancelDecreaseStakeRequest(stakerAccount),
        'Only owner or DelegateManager'
      )
      await _lib.assertRevert(
        serviceProviderFactory.cancelDecreaseStakeRequest(stakerAccount, { from: stakerAccount }),
        'Decrease stake request must be pending'
      )
    })

    it('Service type operations test', async () => {
      let typeMinVal = _lib.audToWei(200)
      let typeMaxVal = _lib.audToWei(20000)
      let typeMin = _lib.toBN(typeMinVal)
      let typeMax = _lib.toBN(typeMaxVal)
      let testType = web3.utils.utf8ToHex('test-service')
      const addServiceTypeSignature = 'addServiceType(bytes32,uint256,uint256)'

      let isValid = await serviceTypeManager.serviceTypeIsValid(testType)
      assert.isFalse(isValid, 'Invalid type expected')

      // Expect failure as service type has not been registered
      await _lib.assertRevert(
        serviceTypeManager.getCurrentVersion(testType),
        'No registered version of serviceType'
      )

      // Expect failure when not called from governance
      await _lib.assertRevert(
        serviceTypeManager.addServiceType(testDiscProvType, typeMin, typeMax, { from: accounts[12] }),
        'Only callable by Governance contract.'
      )

      // Expect failure as type is already present
      const callDataDP = _lib.abiEncode(
        ['bytes32', 'uint256', 'uint256'],
        [testDiscProvType, typeMinVal, typeMaxVal]
      )
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue,
          addServiceTypeSignature,
          callDataDP,
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )

      // Add new serviceType
      const callDataT = _lib.abiEncode(
        ['bytes32', 'uint256', 'uint256'],
        [testType, typeMinVal, typeMaxVal]
      )
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        addServiceTypeSignature,
        callDataT,
        { from: guardianAddress }
      )

      // Confirm presence of test type in list
      let validTypes = (await serviceTypeManager.getValidServiceTypes()).map(x => web3.utils.hexToUtf8(x))
      let typeFound = false
      for (let type of validTypes) {
        if (type === web3.utils.hexToUtf8(testType)) typeFound = true
      }
      assert.isTrue(typeFound, 'Expect type to be found in valid list')

      // bytes32 version string
      let testVersion = web3.utils.utf8ToHex('0.0.1')
      assert.isFalse(
        await serviceTypeManager.serviceVersionIsValid(testType, testVersion),
        'Expect invalid version prior to registration'
      )

      // Confirm only governance can call set functions
      await _lib.assertRevert(
        serviceTypeManager.setGovernanceAddress(_lib.addressZero),
        'Only callable by Governance contract'
      )
      await _lib.assertRevert(
        serviceTypeManager.setServiceVersion(web3.utils.utf8ToHex('fake-type'), web3.utils.utf8ToHex('0.0')),
        'Only callable by Governance contract'
      )

      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion]),
        { from: guardianAddress }
      )

      assert.isTrue(
        await serviceTypeManager.serviceVersionIsValid(testType, testVersion),
        'Expect version after registration'
      )

      // Fail to setServiceVersion to version that is already registered
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue,
          'setServiceVersion(bytes32,bytes32)',
          _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )

      let chainVersion = await serviceTypeManager.getCurrentVersion(testType)
      assert.equal(
        web3.utils.hexToUtf8(testVersion),
        web3.utils.hexToUtf8(chainVersion),
        'Expect test version to be set')

      let numberOfVersions = await serviceTypeManager.getNumberOfVersions(testType)
      // Expect failure to retrieve version without decrementing numberOfVersions to index 0
      await _lib.assertRevert(
        serviceTypeManager.getVersion(testType, numberOfVersions),
        'No registered version of serviceType')

      // Confirm valid version at 0 index when queried
      assert.equal(
        web3.utils.hexToUtf8(await serviceTypeManager.getVersion(testType, numberOfVersions.sub(_lib.toBN(1)))),
        web3.utils.hexToUtf8(testVersion),
        'Expect initial test type version at 0 index')

      let testVersion2 = web3.utils.utf8ToHex('0.0.2')

      // fail to set version for invalid type
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue,
          'setServiceVersion(bytes32,bytes32)',
          _lib.abiEncode(['bytes32', 'bytes32'], [web3.utils.utf8ToHex('undefined-type'), testVersion]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )
      
      // Update version again
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion2]),
        { from: guardianAddress }
      )

      // Validate number of versions
      let numVersions = await serviceTypeManager.getNumberOfVersions(testType)
      assert.isTrue(numVersions.eq(web3.utils.toBN(2)), 'Expect 2 versions')
      let lastIndex = numVersions.sub(web3.utils.toBN(1))
      let lastIndexVersionFromChain = await serviceTypeManager.getVersion(testType, lastIndex)
      // Additional validation
      assert.equal(
        web3.utils.hexToUtf8(lastIndexVersionFromChain),
        web3.utils.hexToUtf8(testVersion2),
        'Latest version equals expected')
      assert.equal(
        lastIndexVersionFromChain,
        await serviceTypeManager.getCurrentVersion(testType),
        'Expect equal current and last index')

      isValid = await serviceTypeManager.serviceTypeIsValid(testType)
      assert.isTrue(isValid, 'Expect valid type after registration')

      const info = await serviceTypeManager.getServiceTypeInfo(testType)
      assert.isTrue(info.isValid, 'Expected testType to be valid')
      assert.isTrue(info.minStake.eq(_lib.toBN(typeMin)), 'Min values not equal')
      assert.isTrue(info.maxStake.eq(_lib.toBN(typeMax)), 'Max values not equal')

      const unregisteredType = web3.utils.utf8ToHex('invalid-service')

      // removeServiceType fails when not called from Governance
      await _lib.assertRevert(
        serviceTypeManager.removeServiceType(testType, { from: accounts[12] }), 'Only callable by Governance contract.'
      )

      // removeServiceType fails with unregistered serviceType
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue,
          'removeServiceType(bytes32)',
          _lib.abiEncode(['bytes32'], [unregisteredType]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )

      // removeServiceType successfully
      let removeTypeTx = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'removeServiceType(bytes32)',
        _lib.abiEncode(['bytes32'], [testType]),
        { from: guardianAddress }
      )
      await expectEvent.inTransaction(
        removeTypeTx.tx, ServiceTypeManager, 'ServiceTypeRemoved',
        { _serviceType: web3.utils.padRight(testType, 64) }
      )

      // Confirm serviceType is no longer valid after removal
      isValid = await serviceTypeManager.serviceTypeIsValid(testType)
      assert.isFalse(isValid, 'Expect invalid type after deregistration')

      const registry2 = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)
      const governance2 = await _lib.deployGovernance(
        artifacts,
        proxyAdminAddress,
        proxyDeployerAddress,
        registry2,
        VOTING_PERIOD,
        EXECUTION_DELAY,
        VOTING_QUORUM_PERCENT,
        guardianAddress
      )
      
      // fail to set a non-Governance address in ServiceTypeManager.sol
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          serviceTypeManagerProxyKey,
          callValue,
          'setGovernanceAddress(address)',
          _lib.abiEncode(['address'], [accounts[14]]),
          { from: guardianAddress }
        ),
        "Governance: Transaction failed."
      )
      
      // setGovernanceAddress in ServiceTypeManager.sol
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [governance2.address]),
        { from: guardianAddress }
      )
      assert.equal(
        await serviceTypeManager.getGovernanceAddress(),
        governance2.address,
        "Didn't update governance address correctly in ServiceTypeManager"
      )
    })

    it('Operations after serviceType removal', async () => {
      /** 
       * Confirm initial state of serviceType and serviceProvider
       * Remove serviceType
       * Confirm new state of serviceType and serviceProvider
       * Deregister SP of serviceType
       * Confirm new state of serviceType and serviceProvider
       * Attempt to register new SP after serviceType removal
       * Confirm serviceType cannot be re-added
       */

      const minStakeBN = _lib.toBN(dpTypeMin)
      const maxStakeBN = _lib.toBN(dpTypeMax)

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

      // Remove serviceType
      await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
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
      const spDetails1 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      assert.isTrue(spDetails1.deployerStake.eq(DEFAULT_AMOUNT), 'Expected deployerStake == default amount')
      assert.isTrue(spDetails1.validBounds, 'Expected validBounds == true')
      assert.isTrue(spDetails1.numberOfEndpoints.eq(_lib.toBN(1)), 'Expected one endpoint')
      assert.isTrue(spDetails1.minAccountStake.eq(minStakeBN), 'Expected minAccountStake == dpTypeMin')
      assert.isTrue(spDetails1.maxAccountStake.eq(maxStakeBN), 'Expected maxAccountStake == dpTypeMax')

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

      // Confirm SP details are changed after deregistration
      const spDetails2 = await serviceProviderFactory.getServiceProviderDetails.call(stakerAccount)
      assert.isTrue(spDetails2.deployerStake.isZero(), 'Expected deployerStake == 0')
      assert.isTrue(spDetails2.validBounds, 'Expected validBounds == true')
      assert.isTrue(spDetails2.numberOfEndpoints.isZero(), 'Expected numberOfEndpoints == 0')
      assert.isTrue(spDetails2.minAccountStake.isZero(), 'Expected minAccountStake == 0')
      assert.isTrue(spDetails2.maxAccountStake.isZero(), 'Expected maxAccountStake == 0')

      // Confirm new SP cannot be registered after serviceType removal
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint2,
          DEFAULT_AMOUNT,
          stakerAccount3
        ),
        "Valid service type required"
      )

      // Confirm serviceType cannot be re-added
      await _lib.assertRevert(
        _lib.addServiceType(testDiscProvType, dpTypeMin, dpTypeMax, governance, guardianAddress, serviceTypeManagerProxyKey)
        /* Cannot check revert msg bc call is made via governance */
      )
    })
  })
})
