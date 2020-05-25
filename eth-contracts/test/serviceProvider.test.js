import * as _lib from '../utils/lib.js'
const { time } = require('@openzeppelin/test-helpers')

const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ClaimsManager = artifacts.require('ClaimsManager')
const MockDelegateManager = artifacts.require('MockDelegateManager')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')

const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
const testCreatorNodeType = web3.utils.utf8ToHex('creator-node')
const testInvalidType = web3.utils.utf8ToHex('invalid-type')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

const MIN_STAKE_AMOUNT = 10
const VOTING_PERIOD = 10
const VOTING_QUORUM = 1

const INITIAL_BAL = _lib.audToWeiBN(1000)
const DEFAULT_AMOUNT = _lib.audToWeiBN(120)


contract('ServiceProvider test', async (accounts) => {
  let token, registry, staking0, stakingInitializeData, proxy, claimsManager0, claimsManagerProxy, claimsManager, governance
  let staking, serviceProviderFactory, serviceTypeManager, mockDelegateManager

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress, fakeGovernanceAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

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

    const args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    return args
  }

  const getStakeAmountForAccount = async (account) => staking.totalStakedFor(account)

  const decreaseRegisteredProviderStake = async (decrease, account) => {
    if(!web3.utils.isBN(decrease)) {
      decrease = web3.utils.toBN(decrease)
    }

    // Request decrease in stake
    await serviceProviderFactory.requestDecreaseStake(decrease, { from: account })

    let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(account)
    // Advance to valid block
    await time.advanceBlockTo(requestInfo.lockupExpiryBlock)

    // Approve token transfer from staking contract to account
    const tx = await serviceProviderFactory.decreaseStake({ from: account })
    const args = tx.logs.find(log => log.event === 'UpdatedStakeAmount').args
    return args
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
      VOTING_QUORUM,
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
      proxyAdminAddress,
      stakingInitializeData,
      governance.address,
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
      proxyAdminAddress,
      serviceTypeInitializeData,
      governance.address,
      { from: proxyAdminAddress }
    )
    serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManager.address, { from: proxyDeployerAddress })

    // Deploy claimsManagerProxy
    claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      proxyAdminAddress,
      claimsInitializeCallData,
      governance.address,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)

    // Register claimsManagerProxy
    await registry.addContract(claimsManagerProxyKey, claimsManagerProxy.address, { from: proxyDeployerAddress })

    // Deploy mock delegate manager with only function to forward processClaim call
    mockDelegateManager = await MockDelegateManager.new()
    await mockDelegateManager.initialize(claimsManagerProxy.address)
    await registry.addContract(delegateManagerKey, mockDelegateManager.address, { from: proxyDeployerAddress })

    /** addServiceTypes creatornode and discprov via Governance */
    await _lib.addServiceType(testCreatorNodeType, cnTypeMin, cnTypeMax, governance, guardianAddress, serviceTypeManagerProxyKey, true)
    const serviceTypeCNStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(testCreatorNodeType)
    const [cnTypeMinV, cnTypeMaxV] = [serviceTypeCNStakeInfo[0], serviceTypeCNStakeInfo[1]]
    assert.equal(cnTypeMin, cnTypeMinV, 'Expected same minStake')
    assert.equal(cnTypeMax, cnTypeMaxV, 'Expected same maxStake')

    await _lib.addServiceType(testDiscProvType, dpTypeMin, dpTypeMax, governance, guardianAddress, serviceTypeManagerProxyKey, true)
    const serviceTypeDPStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(testDiscProvType)
    const [dpTypeMinV, dpTypeMaxV] = [serviceTypeDPStakeInfo[0], serviceTypeDPStakeInfo[1]]
    assert.equal(dpTypeMin, dpTypeMinV, 'Expected same minStake')
    assert.equal(dpTypeMax, dpTypeMaxV, 'Expected same maxStake')

    // Deploy + register ServiceProviderFactory
    let serviceProviderFactory0 = await ServiceProviderFactory.new({ from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [registry.address, governance.address]
    )
    let serviceProviderFactoryProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      governance.address,
      { from: proxyAdminAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: proxyDeployerAddress })

    // Transfer 1000 tokens to accounts[11]
    await token.transfer(accounts[11], INITIAL_BAL, { from: proxyDeployerAddress })
    // ---- Configuring addresses
    await _lib.configureGovernanceStakingAddress(
      governance,
      governanceKey,
      guardianAddress,
      staking.address
    )
    // ---- Set up staking contract permissions
    await _lib.configureStakingContractAddresses(
      governance,
      guardianAddress,
      stakingProxyKey,
      staking,
      serviceProviderFactoryProxy.address,
      claimsManagerProxy.address,
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

    await _lib.configureServiceProviderFactoryAddresses(
      governance,
      guardianAddress,
      serviceProviderFactoryKey,
      serviceProviderFactory,
      staking.address,
      serviceTypeManagerProxy.address,
      claimsManagerProxy.address,
      mockDelegateManager.address
    )
  })

  describe('Registration flow', () => {
    const stakerAccount = accounts[11]
    const stakerAccount2 = accounts[12]
    let regTx

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

      const spTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testDiscProvType)
      const typeMin = _lib.fromWei(spTypeInfo[0])
      const typeMax = _lib.fromWei(spTypeInfo[1])

      // Validate stake requirements
      // Both current account bounds and single testDiscProvType bounds expected to be equal
      assert.equal(
        typeMin,
        _lib.fromWei(spDetails.minAccountStake),
        'Expect account min to equal sp type 1 min'
      )
      assert.equal(
        typeMax,
        _lib.fromWei(spDetails.maxAccountStake),
        'Expect account max to equal sp type 1 max'
      )
    })

    const multipleEndpointScenario = async () => {
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      // 2nd endpoint for stakerAccount = https://localhost:5001
      // discovery-provider
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

      let cnTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testCreatorNodeType)
      let cnTypeMin = cnTypeInfo[0]
      let cnTypeMax = cnTypeInfo[1]
      let dpTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testDiscProvType)
      let dpTypeMin = dpTypeInfo[0]

      // Total Stake = 240 AUD <-- Expect failure
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testCreatorNodeType,
          testCnodeEndpoint1,
          0,
          stakerAccount),
        'Minimum stake requirement not met')

      // 3rd endpoint for stakerAccount = https://localhost:4001
      // creator-node
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testCreatorNodeType,
        testCnodeEndpoint1,
        cnTypeMin,
        stakerAccount)

      let testDiscProvs = await getServiceProviderIdsFromAddress(stakerAccount, testDiscProvType)
      let testCnodes = await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)
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
          testCreatorNodeType,
          testCnodeEndpoint2,
          _lib.audToWeiBN(transferAmount),
          stakerAccount),
        'Maximum stake'
      )

      let numCnodeEndpoints = await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)

      // 4th endpoint for service provider
      // creator-node
      await _lib.registerServiceProvider(
        token,
        staking,
        serviceProviderFactory,
        testCreatorNodeType,
        testCnodeEndpoint2,
        cnTypeMin,
        stakerAccount)

      assert.equal(
        numCnodeEndpoints.length + 1,
        (await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)).length,
        'Expect increase in number of endpoints')

      stakedAmount = await staking.totalStakedFor(stakerAccount)
      numCnodeEndpoints = await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)

      // Confirm failure to deregister invalid endpoint and service type combination
      await _lib.assertRevert(
        _lib.deregisterServiceProvider(
          serviceProviderFactory,
          testCreatorNodeType,
          testEndpoint,
          stakerAccount
        ),
        'Invalid endpoint for service type'
      )

      // Successfully deregister
      await _lib.deregisterServiceProvider(
        serviceProviderFactory,
        testCreatorNodeType,
        testCnodeEndpoint2,
        stakerAccount)
      assert.isTrue(stakedAmount.eq(await staking.totalStakedFor(stakerAccount)), 'Expect no stake change')
    }

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

    it('Confirm correct stake for account', async () => {
      assert.isTrue((await getStakeAmountForAccount(stakerAccount)).eq(DEFAULT_AMOUNT))
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

    it('Min direct deployer stake violation', async () => {
      let minDirectStake = await serviceProviderFactory.getMinDeployerStake()
      // Calculate an invalid direct stake amount
      let invalidDirectStake = minDirectStake.sub(_lib.toBN(1))
      await token.transfer(stakerAccount2, invalidDirectStake, { from: proxyDeployerAddress })
      let dpTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testDiscProvType)
      let dpTypeMin = dpTypeInfo[0]
      // Validate that this value won't violate service type minimum
      assert.isTrue(invalidDirectStake.gt(dpTypeMin), 'Invalid direct stake above dp type min')
      await _lib.assertRevert(
        _lib.registerServiceProvider(
          token,
          staking,
          serviceProviderFactory,
          testDiscProvType,
          testEndpoint1,
          invalidDirectStake,
          stakerAccount2),
        'Direct stake restriction violated')
    })

    it('Update service provider cut', async () => {
      let updatedCutValue = 10
      await _lib.assertRevert(
        serviceProviderFactory.updateServiceProviderCut(
          stakerAccount,
          updatedCutValue,
          { from: accounts[4] }),
        'Service Provider cut update operation restricted to deployer')
      await serviceProviderFactory.updateServiceProviderCut(
        stakerAccount,
        updatedCutValue,
        { from: stakerAccount })
      let info = await serviceProviderFactory.getServiceProviderDetails(stakerAccount)
      assert.isTrue((info.deployerCut).eq(_lib.toBN(updatedCutValue)), 'Expect updated cut')
      let newCut = 110
      let base = await serviceProviderFactory.getServiceProviderDeployerCutBase()
      assert.isTrue(_lib.toBN(newCut).gt(base), 'Expect invalid newCut')
      await _lib.assertRevert(
        serviceProviderFactory.updateServiceProviderCut(stakerAccount, newCut, { from: stakerAccount }),
        'Service Provider cut cannot exceed base value')
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
      let tx = await serviceProviderFactory.updateDelegateOwnerWallet(
        testDiscProvType,
        testEndpoint,
        newDelegateOwnerWallet,
        { from: stakerAccount })

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
      await multipleEndpointScenario()
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
      await serviceProviderFactory.updateEndpoint(testDiscProvType, testEndpoint, testEndpoint1, { from: stakerAccount })
      const { endpoint: endpointAfter } = await serviceProviderFactory.getServiceEndpointInfo(testDiscProvType, spId)
      assert.equal(testEndpoint1, endpointAfter)

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

    it('will fail to set the governance address from not current governance contract', async () => {
      await _lib.assertRevert(
        serviceProviderFactory.setGovernanceAddress(fakeGovernanceAddress),
        'Only callable by Governance contract'
      )
    })

    it('will set the new governance address if called from current governance contract', async () => {
      assert.equal(
        governance.address,
        await serviceProviderFactory.getGovernanceAddress(),
        "expected governance address before changing"  
      )

      await governance.guardianExecuteTransaction(
        serviceProviderFactoryKey,
        callValue,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [fakeGovernanceAddress]),
        { from: guardianAddress }
      )

      assert.equal(
        fakeGovernanceAddress,
        await serviceProviderFactory.getGovernanceAddress(),
        "updated governance addresses don't match"
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
      assert.isTrue(!isValid, 'Invalid type expected')

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
      const addSPDPTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        addServiceTypeSignature,
        callDataDP,
        { from: guardianAddress }
      )
      assert.isFalse(_lib.parseTx(addSPDPTxReceipt).event.args.success, 'Expected tx to fail')

      // Add new serviceType
      const callDataT = _lib.abiEncode(
        ['bytes32', 'uint256', 'uint256'],
        [testType, typeMinVal, typeMaxVal]
      )
      const addSPTTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        addServiceTypeSignature,
        callDataT,
        { from: guardianAddress }
      )
      assert.isTrue(_lib.parseTx(addSPTTxReceipt).event.args.success, 'Expected tx to succeed')

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

      const setServiceVersionTxR = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion]),
        { from: guardianAddress }
      )
      assert.isTrue(_lib.parseTx(setServiceVersionTxR).event.args.success, 'Expected tx to succeed')

      assert.isTrue(
        await serviceTypeManager.serviceVersionIsValid(testType, testVersion),
        'Expect version after registration'
      )

      // Fail to setServiceVersion to version that is already registered
      const setServiceVersionTxR2 = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion]),
        { from: guardianAddress }
      )
      assert.isFalse(_lib.parseTx(setServiceVersionTxR2).event.args.success, 'Expected tx to fail')

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

      // Update version again
      const setServiceVersionTxR3 = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'setServiceVersion(bytes32,bytes32)',
        _lib.abiEncode(['bytes32', 'bytes32'], [testType, testVersion2]),
        { from: guardianAddress }
      )
      assert.isTrue(_lib.parseTx(setServiceVersionTxR3).event.args.success, 'Expected tx to succeed')

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

      let info = await serviceTypeManager.getServiceTypeStakeInfo(testType)
      assert.isTrue(typeMin.eq(info.min), 'Min values not equal')
      assert.isTrue(typeMax.eq(info.max), 'Max values not equal')

      const newMinVal = _lib.audToWei(300)
      const newMaxVal = _lib.audToWei(40000)
      const newMin = _lib.toBN(newMinVal)
      const newMax = _lib.toBN(newMaxVal)

      // Expect failure from invalid account
      await _lib.assertRevert(
        serviceTypeManager.updateServiceType(testType, newMin, newMax, { from: accounts[12] }),
        'Only callable by Governance contract.'
      )

      // updateServiceType should fail with unregistered serviceType
      const unregisteredType = web3.utils.utf8ToHex('invalid-service')
      let updateServiceTypeTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'updateServiceType(bytes32,uint256,uint256)',
        _lib.abiEncode(['bytes32', 'uint256', 'uint256'], [unregisteredType, newMinVal, newMaxVal]),
        { from: guardianAddress }
      )
      assert.isFalse(_lib.parseTx(updateServiceTypeTxReceipt).event.args.success, 'Expected tx to fail')

      // updateServiceType successfully
      updateServiceTypeTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'updateServiceType(bytes32,uint256,uint256)',
        _lib.abiEncode(['bytes32', 'uint256', 'uint256'], [testType, newMinVal, newMaxVal]),
        { from: guardianAddress }
      )
      assert.isTrue(_lib.parseTx(updateServiceTypeTxReceipt).event.args.success, 'Expected tx to succeed')

      // Confirm serviceType was updated
      info = await serviceTypeManager.getServiceTypeStakeInfo(testType)
      assert.isTrue(newMin.eq(info.min), 'Min values not equal')
      assert.isTrue(newMax.eq(info.max), 'Max values not equal')

      // removeServiceType fails when not called from Governance
      await _lib.assertRevert(
        serviceTypeManager.removeServiceType(testType, { from: accounts[12] }), 'Only callable by Governance contract.'
      )

      // removeServiceType fails with unregistered serviceType
      let removeServiceTypeTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'removeServiceType(bytes32)',
        _lib.abiEncode(['bytes32'], [unregisteredType]),
        { from: guardianAddress }
      )
      assert.isFalse(_lib.parseTx(removeServiceTypeTxReceipt).event.args.success, 'Expected tx to fail')

      // removeServiceType successfully
      removeServiceTypeTxReceipt = await governance.guardianExecuteTransaction(
        serviceTypeManagerProxyKey,
        callValue,
        'removeServiceType(bytes32)',
        _lib.abiEncode(['bytes32'], [testType]),
        { from: guardianAddress }
      )
      assert.isTrue(_lib.parseTx(removeServiceTypeTxReceipt).event.args.success, 'Expected tx to succeed')

      // Confirm serviceType is no longer valid after removal
      isValid = await serviceTypeManager.serviceTypeIsValid(testType)
      assert.isTrue(!isValid, 'Expect invalid type after deregistration')
    })
  })
})
