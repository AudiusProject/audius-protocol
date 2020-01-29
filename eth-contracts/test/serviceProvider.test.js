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

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

const testServiceType = web3.utils.utf8ToHex('test-service')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

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

  const DEFAULT_AMOUNT = 120
  const INITIAL_BAL = 1000
  const MIN_STAKE_AMOUNT = 10
  const MAX_STAKE_AMOUNT = DEFAULT_AMOUNT * 100

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

    // Reset min for test purposes
    await staking.setMinStakeAmount(MIN_STAKE_AMOUNT)

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
    await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: account })

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

  const getStakeAmountFromEndpoint = async (endpoint, type) => {
    let stakeAmount = await serviceProviderFactory.getStakeAmountFromEndpoint(
      endpoint,
      type)
    return fromBn(stakeAmount)
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
    const stakerAccount = accounts[1]
    const stakerAccount2 = accounts[2]
    beforeEach(async () => {
      let initialBal = await getTokenBalance(token, stakerAccount)

      regTx = await registerServiceProvider(
        testServiceType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      // Confirm event has correct amount
      assert.equal(regTx.stakedAmountInt, DEFAULT_AMOUNT)

      // Confirm balance updated for tokens
      let finalBal = await getTokenBalance(token, stakerAccount)
      assert.equal(initialBal, finalBal + DEFAULT_AMOUNT, 'Expect funds to be transferred')

      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testServiceType,
        regTx.spID)
      assert.isTrue(
        newIdFound,
        'Expected to find newly registered ID associated with this account')

      let stakedAmount = await getStakeAmountForAccount(stakerAccount)
      assert.equal(
        stakedAmount,
        DEFAULT_AMOUNT,
        'Expect default stake amount')
    })

    /*
     * Confirm stake exists in contract for account after basic registration
     */
    it('confirm registered stake', async () => {
      // Confirm staking contract has correct amt
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)
    })

    /*
     * Remove endpoint and confirm transfer of staking balance to owner
     */
    it('deregisters and unstakes', async () => {
      // Confirm staking contract has correct amt
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      // deregister service provider
      let deregTx = await deregisterServiceProvider(
        testServiceType,
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
          testServiceType,
          testEndpoint,
          DEFAULT_AMOUNT,
          stakerAccount),
        'Endpoint already registered')
    })

    /*
     * Attempt to register first endpoint with zero stake, expect error
     */
    it('fails to register endpoint w/zero stake', async () => {
      // let initialBal = await getTokenBalance(token, stakerAccount)
      // Attempt to register first endpoint with zero stake
      await _lib.assertRevert(
        registerServiceProvider(
          testServiceType,
          testEndpoint1,
          0,
          stakerAccount2))
    })

    it('increases stake value', async () => {
      // Confirm initial amount in staking contract
      assert.equal(await getStakeAmountForAccount(stakerAccount), DEFAULT_AMOUNT)

      await increaseRegisteredProviderStake(
        testServiceType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testServiceType,
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
        decreaseStakeAmount,
        stakerAccount)

      let readStorageValues = await serviceProviderFactory.getServiceProviderInfo(
        testServiceType,
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
      let initialStake = await getStakeAmountForAccount(stakerAccount)
      assert.equal(initialStake, DEFAULT_AMOUNT)
      let decreaseStakeAmount = initialStake
      // Confirm revert
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          decreaseStakeAmount,
          stakerAccount))
    })

    /*
     * Mutate owner wallet and validate function restrictions
     */
    it('updates delegateOwnerWallet', async () => {
      let currentDelegateOwner = await serviceProviderFactory.getDelegateOwnerWallet(
        testServiceType,
        testEndpoint,
        { from: stakerAccount })
      assert.equal(
        stakerAccount,
        currentDelegateOwner,
        'Expect initial delegateOwnerWallet equal to registrant')
      // Confirm wrong owner update is rejected
      await _lib.assertRevert(
        serviceProviderFactory.updateDelegateOwnerWallet(
          testServiceType,
          testEndpoint,
          accounts[7],
          { from: accounts[8] }
        ),
        'Invalid update'
      )
      // Perform and validate update
      let newDelegateOwnerWallet = accounts[4]
      let tx = await serviceProviderFactory.updateDelegateOwnerWallet(
        testServiceType,
        testEndpoint,
        newDelegateOwnerWallet,
        { from: stakerAccount })
      let newDelegateFromChain = await serviceProviderFactory.getDelegateOwnerWallet(
        testServiceType,
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
      let initialBal = await getTokenBalance(token, stakerAccount)
      let registerInfo = await registerServiceProvider(
        testServiceType,
        testEndpoint1,
        DEFAULT_AMOUNT,
        stakerAccount)
      let newSPId = registerInfo.spID
      // Confirm change in token balance
      let finalBal = await getTokenBalance(token, stakerAccount)
      assert.equal(
        (initialBal - finalBal),
        DEFAULT_AMOUNT,
        'Expected decrease in final balance')
      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testServiceType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')
    })

    /*
     * Register a new endpoint under the same account, without adding stake to the account
     */
    it('multiple endpoints w/same account, static stake', async () => {
      let initialBal = await getTokenBalance(token, stakerAccount)
      let registerInfo = await registerServiceProvider(
        testServiceType,
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
        testServiceType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')
    })

    /*
    it('multiple endpoints w/same account, modify stakes', async () => {
      // Approve staking transfer
      let secondEndpointStakeAmount = DEFAULT_AMOUNT / 2
      await token.approve(stakingAddress, secondEndpointStakeAmount, { from: stakerAccount })
      let initialBal = await getTokenBalance(token, stakerAccount)
      let registerInfo = await registerServiceProvider(
        testServiceType,
        testEndpoint1,
        secondEndpointStakeAmount,
        stakerAccount)

      let newSPId = registerInfo.spID
      // Confirm change in token balance
      let finalBal = await getTokenBalance(token, stakerAccount)
      assert.equal(
        (initialBal - finalBal),
        secondEndpointStakeAmount,
        'Expected decrease in final balance')
      let newIdFound = await serviceProviderIDRegisteredToAccount(
        stakerAccount,
        testServiceType,
        newSPId)
      assert.isTrue(newIdFound, 'Expected valid new ID')

      let spFactoryFirstEndpointStake = await getStakeAmountFromEndpoint(testEndpoint, testServiceType)
      let spFactorySecondEndpointStake = await getStakeAmountFromEndpoint(testEndpoint1, testServiceType)
      assert.equal(
        spFactorySecondEndpointStake,
        secondEndpointStakeAmount,
        `Expected second endpoint to have ${secondEndpointStakeAmount} staked`)

      let totalStakedForAccount = fromBn(await staking.totalStakedFor(stakerAccount))
      // Confirm sum of address in staking.sol equals total in sp factory
      assert.equal(
        totalStakedForAccount,
        spFactoryFirstEndpointStake + spFactorySecondEndpointStake,
        `Expect total Staked ${totalStakedForAccount} = ${testEndpoint}:${spFactoryFirstEndpointStake} + ${testEndpoint1}:${spFactorySecondEndpointStake}`)

      // Increase first endpoint stake
      let increaseStakeAmount = DEFAULT_AMOUNT / 4
      await increaseRegisteredProviderStake(
        testServiceType,
        testEndpoint,
        increaseStakeAmount,
        stakerAccount)

      let updatedSpFactoryFirstEndpointStake = await getStakeAmountFromEndpoint(testEndpoint, testServiceType)
      let updatedSpFactorySecondEndpointStake = await getStakeAmountFromEndpoint(testEndpoint1, testServiceType)

      assert.equal(
        updatedSpFactoryFirstEndpointStake,
        DEFAULT_AMOUNT + increaseStakeAmount,
        'Expected increase in sp factory stake for endpoint 1')

      assert.equal(
        updatedSpFactorySecondEndpointStake,
        spFactorySecondEndpointStake,
        'No increase in sp factory stake for endpoint 1')

      // Confirm sum of address in staking.sol equals total in sp factory
      totalStakedForAccount = fromBn(await staking.totalStakedFor(stakerAccount))
      assert.equal(
        totalStakedForAccount,
        updatedSpFactoryFirstEndpointStake + updatedSpFactorySecondEndpointStake,
        `Expect total Staked ${totalStakedForAccount} = ${testEndpoint}:${updatedSpFactoryFirstEndpointStake} + ${testEndpoint1}:${updatedSpFactorySecondEndpointStake}`)

      // Cache stake amount for 2nd endpoint
      spFactorySecondEndpointStake = updatedSpFactorySecondEndpointStake

      // Increase second endpoint stake
      let increaseSecondStakeAmount = DEFAULT_AMOUNT / 8
      await increaseRegisteredProviderStake(
        testServiceType,
        testEndpoint1,
        increaseSecondStakeAmount,
        stakerAccount)

      // Confirm increase in sp factory
      updatedSpFactorySecondEndpointStake =
        await getStakeAmountFromEndpoint(testEndpoint1, testServiceType)
      assert.equal(
        updatedSpFactorySecondEndpointStake,
        spFactorySecondEndpointStake + increaseSecondStakeAmount,
        'Expected increase in sp factory stake for endpoint 2')

      updatedSpFactoryFirstEndpointStake = await getStakeAmountFromEndpoint(testEndpoint, testServiceType)

      totalStakedForAccount = fromBn(await staking.totalStakedFor(stakerAccount))

      // Confirm sum of address in staking.sol equals total in sp factory
      assert.equal(
        totalStakedForAccount,
        updatedSpFactoryFirstEndpointStake + updatedSpFactorySecondEndpointStake,
        `Expect total Staked ${totalStakedForAccount} = ${testEndpoint}:${updatedSpFactoryFirstEndpointStake} + ${testEndpoint1}:${updatedSpFactorySecondEndpointStake}`)

      // Confirm decreasing below current balance in SP Factory is rejected
      await _lib.assertRevert(
        decreaseRegisteredProviderStake(
          testServiceType,
          testEndpoint1,
          updatedSpFactorySecondEndpointStake + 10,
          stakerAccount),
        'Cannot reduce stake amount below zero')

      // Cache values locally
      let decreaseFirstStakeAmount = DEFAULT_AMOUNT / 12
      let firstEndpointStake = updatedSpFactoryFirstEndpointStake
      totalStakedForAccount = fromBn(await staking.totalStakedFor(stakerAccount))

      // Decrease stake for endpoint1
      await decreaseRegisteredProviderStake(
        testServiceType,
        testEndpoint,
        decreaseFirstStakeAmount,
        stakerAccount)

      // Validate state change
      updatedSpFactoryFirstEndpointStake = await getStakeAmountFromEndpoint(testEndpoint, testServiceType)
      assert.equal(
        updatedSpFactoryFirstEndpointStake,
        firstEndpointStake - decreaseFirstStakeAmount,
        `Expected total stake decreased for ${testEndpoint} in SPFactory`)

      assert.equal(
        decreaseFirstStakeAmount,
        totalStakedForAccount - fromBn(await staking.totalStakedFor(stakerAccount)),
        `Expected total stake decrease for ${stakerAccount} of ${decreaseFirstStakeAmount}`)

      // Cache 2nd SP values locally
      let decreaseSecondStakeAmount = DEFAULT_AMOUNT / 10
      let secondEndpointStake = updatedSpFactorySecondEndpointStake
      totalStakedForAccount = fromBn(await staking.totalStakedFor(stakerAccount))

      // Decrease stake
      await decreaseRegisteredProviderStake(
        testServiceType,
        testEndpoint1,
        decreaseSecondStakeAmount,
        stakerAccount)

      // Validate state change
      updatedSpFactorySecondEndpointStake = await getStakeAmountFromEndpoint(testEndpoint1, testServiceType)
      assert.equal(
        updatedSpFactorySecondEndpointStake,
        secondEndpointStake - decreaseSecondStakeAmount,
        `Expected total stake decreased for ${testEndpoint1} in SPFactory`)

      assert.equal(
        decreaseSecondStakeAmount,
        totalStakedForAccount - fromBn(await staking.totalStakedFor(stakerAccount)),
        `Expected total stake decrease for ${stakerAccount} of ${decreaseSecondStakeAmount}`)
      // Deregister endpoints
      let deregTx = await deregisterServiceProvider(
        testServiceType,
        testEndpoint,
        stakerAccount)
      let deregisteredId = deregTx.spID
      let idsList = await getServiceProviderIdsFromAddress(stakerAccount, testServiceType)
      assert.isFalse(
        idsList.includes(deregisteredId),
        'Expected update to array of IDs')
      deregTx = await deregisterServiceProvider(
        testServiceType,
        testEndpoint1,
        stakerAccount)
      deregisteredId = deregTx.spID
      idsList = await getServiceProviderIdsFromAddress(stakerAccount, testServiceType)
      assert.isFalse(
        idsList.includes(deregisteredId),
        'Expected update to array of IDs')
    })
    */
  })
})
