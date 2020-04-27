import * as _lib from './_lib/lib.js'
const encodeCall = require('../utils/encodeCall')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')

const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
const testCreatorNodeType = web3.utils.utf8ToHex('creator-node')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

const MIN_STAKE_AMOUNT = 10

const fromBn = n => parseInt(n.valueOf(), 10)

const getTokenBalance = async (token, account) => fromBn(await token.balanceOf(account))

const toWei = (aud) => {
  const amountInAudWei = web3.utils.toWei(aud.toString(), 'ether')
  const amountInAudWeiBN = web3.utils.toBN(amountInAudWei)
  return amountInAudWeiBN
}

const fromWei = (wei) => {
  return web3.utils.fromWei(wei)
}

// 1000 AUD converted to AUDWei, multiplying by 10^18
const INITIAL_BAL = toWei(1000)
const DEFAULT_AMOUNT = toWei(120)

contract('ServiceProvider test', async (accounts) => {
  let token, registry, staking0, stakingInitializeData, proxy
  let staking, serviceProviderStorage, serviceProviderFactory, serviceTypeManager

  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts
  let controllerAddress

  beforeEach(async () => {
    registry = await Registry.new()
    token = await AudiusToken.new({ from: treasuryAddress })
    // Set up staking
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        treasuryAddress,
        registry.address,
        claimsManagerProxyKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )

    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    staking = await Staking.at(proxy.address)
    await registry.addContract(stakingProxyKey, proxy.address, { from: treasuryAddress })

    // Deploy service type manager
    controllerAddress = accounts[9]
    let serviceTypeInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32'],
      [
        registry.address,
        controllerAddress,
        governanceKey
      ]
    )
    let serviceTypeManager0 = await ServiceTypeManager.new({ from: treasuryAddress })
    let serviceTypeManagerProxy = await AdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeInitializeData,
      { from: proxyAdminAddress }
    )

    serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address, { from: treasuryAddress })

    // Deploy ServiceProviderStorage
    serviceProviderStorage = await ServiceProviderStorage.new(registry.address, { from: treasuryAddress })
    await registry.addContract(serviceProviderStorageKey, serviceProviderStorage.address, { from: treasuryAddress })

    // Deploy ServiceProviderFactory
    serviceProviderFactory = await ServiceProviderFactory.new(
      registry.address,
      stakingProxyKey,
      delegateManagerKey,
      governanceKey,
      serviceTypeManagerProxyKey,
      serviceProviderStorageKey)

    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address, { from: treasuryAddress })
    // Transfer 1000 tokens to accounts[11]
    await token.transfer(accounts[11], INITIAL_BAL, { from: treasuryAddress })
  })

  /* Helper functions */

  const registerServiceProvider = async (type, endpoint, amount, account) => {
    // Approve staking transfer
    await token.approve(staking.address, amount, { from: account })

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
      staking.address,
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

  describe('Registration flow', () => {
    let regTx
    const stakerAccount = accounts[11]
    const stakerAccount2 = accounts[12]

    beforeEach(async () => {
      const initialBal = await token.balanceOf(stakerAccount)

      // 1st endpoint for stakerAccount = https://localhost:5000
      // Total Stake = 120 AUD
      regTx = await registerServiceProvider(
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount
      )

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

      let spTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testDiscProvType)
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

    const multipleEndpointScenario = async (increaseStake = true) => {
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      // 2nd endpoint for stakerAccount = https://localhost:5001
      // Total Stake = 240 AUD
      let registerInfo = await registerServiceProvider(
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
      await token.transfer(stakerAccount, INITIAL_BAL, { from: treasuryAddress })

      let stakedAmount = await staking.totalStakedFor(stakerAccount)
      let bounds = await serviceProviderFactory.getAccountStakeBounds(stakerAccount)
      let accountMin = fromWei(bounds[0])
      let accountMax = fromWei(bounds[1])

      let accountDiff = fromWei(stakedAmount) - accountMin

      await decreaseRegisteredProviderStake(toWei(accountDiff), stakerAccount)
      stakedAmount = await staking.totalStakedFor(stakerAccount)

      let testEndpoint = 'https://localhost:4000'
      let testEndpoint2 = 'https://localhost:4001'

      let cnTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testCreatorNodeType)
      let cnTypeMin = cnTypeInfo[0]
      let cnTypeMax = cnTypeInfo[1]
      let dpTypeInfo = await serviceTypeManager.getServiceTypeStakeInfo(testDiscProvType)
      let dpTypeMin = dpTypeInfo[0]

      // 3rd endpoint for stakerAccount = https://localhost:4001
      // Total Stake = 240 AUD <-- Expect failure
      await _lib.assertRevert(
        registerServiceProvider(
          testCreatorNodeType,
          testEndpoint,
          0,
          stakerAccount),
        'Minimum stake threshold')

      let registerInfo2 = await registerServiceProvider(
        testCreatorNodeType,
        testEndpoint,
        cnTypeMin,
        stakerAccount)

      let testDiscProvs = await getServiceProviderIdsFromAddress(stakerAccount, testDiscProvType)
      let testCnodes = await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)
      let cnodeMinStake = cnTypeMin * testCnodes.length
      let dpMinStake = dpTypeMin * testDiscProvs.length

      stakedAmount = await staking.totalStakedFor(stakerAccount)
      assert.equal(stakedAmount, dpMinStake + cnodeMinStake, 'Expect min staked with total endpoints')

      bounds = await serviceProviderFactory.getAccountStakeBounds(stakerAccount)
      let stakedAmountWei = fromWei(stakedAmount)
      accountMin = fromWei(bounds[0])
      accountMax = fromWei(bounds[1])
      assert.equal(stakedAmountWei, accountMin, 'Expect min staked with total endpoints')

      accountDiff = accountMax - stakedAmountWei
      // Generate BNjs value
      let transferAmount = web3.utils.toBN(
        accountDiff
      ).add(
        web3.utils.toBN(fromWei(cnTypeMax))
      ).add(
        web3.utils.toBN(200)
      )

      // Transfer greater than max tokens
      await token.transfer(stakerAccount, toWei(transferAmount), { from: treasuryAddress })

      // Attempt to register, expect max stake bounds to be exceeded
      await _lib.assertRevert(
        registerServiceProvider(
          testCreatorNodeType,
          testEndpoint2,
          toWei(transferAmount),
          stakerAccount),
        'Maximum stake'
      )

      let numCnodes = await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)

      registerInfo2 = await registerServiceProvider(
        testCreatorNodeType,
        testEndpoint2,
        cnTypeMin,
        stakerAccount)

      assert.equal(
        numCnodes.length + 1,
        (await getServiceProviderIdsFromAddress(stakerAccount, testCreatorNodeType)).length,
        'Expect increase in number of endpoints')
    }

    /*
     * Confirm stake exists in contract for account after basic registration
     */
    it('confirm registered stake', async () => {
      // Confirm staking contract has correct amt
      let returnedValue = await getStakeAmountForAccount(stakerAccount)
      assert.equal(returnedValue, DEFAULT_AMOUNT)
    })

    /*
     * Remove endpoint and confirm transfer of staking balance to owner
     */
    it('deregisters and unstakes', async () => {
      // Confirm staking contract has correct amt
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      // deregister service provider
      let deregTx = await deregisterServiceProvider(
        testDiscProvType,
        testEndpoint,
        stakerAccount)

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

    it('fails to register duplicate endpoint w/same account', async () => {
      // Attempt to register dup endpoint with the same account
      await _lib.assertRevert(
        registerServiceProvider(
          testDiscProvType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount),
        'Endpoint already registered')
    })

    /*
     * Attempt to register first endpoint with zero stake, expect error
     */
    it('fails to register endpoint w/less than minimum stake', async () => {
      await token.transfer(
        stakerAccount2,
        MIN_STAKE_AMOUNT - 1,
        { from: treasuryAddress })

      // Attempt to register first endpoint with zero stake
      await _lib.assertRevert(
        registerServiceProvider(
          testDiscProvType,
          testEndpoint1,
          MIN_STAKE_AMOUNT - 1,
          stakerAccount2),
        'Minimum stake threshold exceeded')
    })

    /*
     * Attempt to register first endpoint with zero stake, expect error
     */
    it('fails to register endpoint w/zero stake', async () => {
      // let initialBal = await getTokenBalance(token, stakerAccount)
      // Attempt to register first endpoint with zero stake
      await _lib.assertRevert(
        registerServiceProvider(
          testDiscProvType,
          testEndpoint1,
          0,
          stakerAccount2),
        'Minimum stake threshold exceeded')
    })

    it('increases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      await increaseRegisteredProviderStake(
        testDiscProvType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testDiscProvType,
        regTx.spID)

      // Confirm increased amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT * 2)
    })

    it('decreases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      let initialBal = await getTokenBalance(token, stakerAccount)
      let decreaseStakeAmount = DEFAULT_AMOUNT / 2

      await decreaseRegisteredProviderStake(
        web3.utils.toBN(decreaseStakeAmount),
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testDiscProvType,
        regTx.spID)

      // Confirm decreased amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT / 2)

      // Confirm balance
      assert.equal(
        await getTokenBalance(token, stakerAccount),
        initialBal + (DEFAULT_AMOUNT / 2),
        'Expect increase in token balance after decreasing stake')
    })

    it('fails to decrease more than staked', async () => {
      // Confirm initial amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)
      let decreaseStakeAmount = DEFAULT_AMOUNT + 2
      // Confirm revert
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          decreaseStakeAmount,
          stakerAccount))
    })

    it('fails to decrease stake to zero without deregistering SPs', async () => {
      // Confirm initial amount in staking contract
      let initialStake = await staking.totalStakedFor(stakerAccount) //  await getStakeAmountForAccount(stakerAccount)
      assert.equal(fromBn(initialStake), DEFAULT_AMOUNT)
      let decreaseStakeAmount = initialStake
      // Confirm revert
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          decreaseStakeAmount,
          stakerAccount),
        'Please deregister endpoints to remove all stake') // Confirm this is the right behavior?
    })

    /*
     * Mutate owner wallet and validate function restrictions
     */
    it('updates delegateOwnerWallet', async () => {
      let currentDelegateOwner = await serviceProviderFactory.getDelegateOwnerWallet(
        testDiscProvType,
        testEndpoint,
        { from: stakerAccount })
      assert.equal(
        stakerAccount,
        currentDelegateOwner,
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
      let newDelegateFromChain = await serviceProviderFactory.getDelegateOwnerWallet(
        testDiscProvType,
        testEndpoint,
        { from: stakerAccount })
      assert.equal(
        newDelegateOwnerWallet,
        newDelegateFromChain,
        'Expect updated delegateOwnerWallet equivalency')
    })

    /*
     * Register a new endpoint under the same account, adding stake to the account
     */
    it('multiple endpoints w/same account, increase stake', async () => {
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      let registerInfo = await registerServiceProvider(
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
    })

    it('multiple endpoints w/multiple accounts varying stake', async () => {
      await multipleEndpointScenario(true)
    })

    /*
     * Register a new endpoint under the same account, without adding stake to the account
     */
    it('multiple endpoints w/same account, static stake', async () => {
      let initialBal = await getTokenBalance(token, stakerAccount)
      let registerInfo = await registerServiceProvider(
        testDiscProvType,
        testEndpoint1,
        0,
        stakerAccount)
      let newSPId = registerInfo.spID
      // Confirm change in token balance
      let finalBal = await getTokenBalance(token, stakerAccount)
      assert.equal(
        (initialBal - finalBal),
        0,
        'Expected no change in final balance')
      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testDiscProvType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')
    })

    it('will modify the dns endpoint for an existing service', async () => {
      const spId = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint)
      const { endpoint } = await serviceProviderFactory.getServiceProviderInfo(testDiscProvType, spId)
      assert.equal(testEndpoint, endpoint)
      
      // update the endpoint from testEndpoint to testEndpoint1
      await serviceProviderFactory.updateEndpoint(testDiscProvType, testEndpoint, testEndpoint1, { from: stakerAccount })
      const { endpoint: endpointAfter } = await serviceProviderFactory.getServiceProviderInfo(testDiscProvType, spId)
      assert.equal(testEndpoint1, endpointAfter)

      // it should replace the service provider in place so spId should be consistent
      const spIdNew = await serviceProviderFactory.getServiceProviderIdFromEndpoint(testEndpoint1)
      assert.isTrue(spId.eq(spIdNew))
    })

    it('will fail to modify the dns endpoint for the wrong owner', async () => {
      // will try to update the endpoint from the incorrect account
      await _lib.assertRevert(
        serviceProviderFactory.updateEndpoint(testDiscProvType, testEndpoint, testEndpoint1),
        'Invalid update endpoint operation, wrong owner'
      )
    })
    
    it('will fail to modify the dns endpoint if the dns endpoint doesnt exist', async () => {
      // will try to update the endpoint from the incorrect account
      const fakeEndpoint = 'https://does.not.exist.com'
      await _lib.assertRevert(
        serviceProviderFactory.updateEndpoint(testDiscProvType, fakeEndpoint, testEndpoint1),
        'Could not find service provider with that endpoint'
      )
    })

    it('service type operations test', async () => {
      let deployer = accounts[0]
      let typeMin = toWei(200)
      let typeMax = toWei(20000)
      let testType = web3.utils.utf8ToHex('test-service')
      let isValid = await serviceTypeManager.isValidServiceType(testType)
      assert.isTrue(!isValid, 'Invalid type expected')

      // Expect failure as type is already present
      await _lib.assertRevert(
        serviceTypeManager.addServiceType(testDiscProvType, typeMin, typeMax, { from: controllerAddress }),
        'Already known service type'
      )
      // Expect failure from invalid account
      await _lib.assertRevert(
        serviceTypeManager.addServiceType(testDiscProvType, typeMin, typeMax, { from: accounts[12] }),
        'Only controller or governance'
      )

      await serviceTypeManager.addServiceType(testType, typeMin, typeMax, { from: controllerAddress })

      isValid = await serviceTypeManager.isValidServiceType(testType)
      assert.isTrue(isValid, 'Expect valid type after registration')

      let info = await serviceTypeManager.getServiceTypeStakeInfo(testType)
      assert.isTrue(typeMin.eq(info.min), 'Min values not equal')
      assert.isTrue(typeMax.eq(info.max), 'Max values not equal')

      let newMin = toWei(300)
      let newMax = toWei(40000)

      let unregisteredType = web3.utils.utf8ToHex('invalid-service')
      // Expect failure with unknown type
      await _lib.assertRevert(
        serviceTypeManager.updateServiceType(unregisteredType, newMin, newMax, { from: controllerAddress }),
        'Invalid service type'
      )
      // Expect failure from invalid account
      await _lib.assertRevert(
        serviceTypeManager.updateServiceType(testType, newMin, newMax, { from: accounts[12] }),
        'Only controller or governance'
      )
      await serviceTypeManager.updateServiceType(testType, newMin, newMax, { from: controllerAddress })

      // Confirm update
      info = await serviceTypeManager.getServiceTypeStakeInfo(testType)
      assert.isTrue(newMin.eq(info.min), 'Min values not equal')
      assert.isTrue(newMax.eq(info.max), 'Max values not equal')

      await _lib.assertRevert(
        serviceTypeManager.removeServiceType(unregisteredType, { from: controllerAddress }), 'Invalid service type, not found'
      )
      await _lib.assertRevert(
        serviceTypeManager.removeServiceType(testType, { from: accounts[12] }), 'Only controller or governance'
      )

      await serviceTypeManager.removeServiceType(testType, { from: controllerAddress })

      isValid = await serviceTypeManager.isValidServiceType(testType)
      assert.isTrue(!isValid, 'Expect invalid type after deregistration')
    })
  })
})
