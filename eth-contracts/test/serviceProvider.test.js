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

const testServiceType = web3.utils.utf8ToHex('discovery-provider')
const testServiceType2 = web3.utils.utf8ToHex('creator-node')
const testEndpoint = 'https://localhost:5000'
const testEndpoint1 = 'https://localhost:5001'

const MIN_STAKE_AMOUNT = 10

// 1000 AUD converted to AUDWei, multiplying by 10^18
const INITIAL_BAL = toWei(1000)
const DEFAULT_AMOUNT = toWei(120)
const MAX_STAKE_AMOUNT = DEFAULT_AMOUNT * 100

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

  beforeEach(async () => {
    registry = await Registry.new()

    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })

    // Deploy registry
    await registry.addContract(ownedUpgradeabilityProxyKey, proxy.address)

    token = await AudiusToken.new({ from: treasuryAddress })
    tokenAddress = token.address
    // console.log(`AudiusToken Address : ${tokenAddress}`)
    let initialTokenBal = fromBn(await token.balanceOf(accounts[0]))
    // console.log(`AudiusToken Balance: ${initialTokenBal}`)
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

    // 1 TAUD = 1 * 10^18
    // Reset min for test purposes
    // await staking.setMinStakeAmount(MIN_STAKE_AMOUNT)

    // Deploy sp storage
    serviceProviderStorage = await ServiceProviderStorage.new(registry.address)
    await registry.addContract(serviceProviderStorageKey, serviceProviderStorage.address)

    // Deploy sp factory
    serviceProviderFactory = await ServiceProviderFactory.new(
      registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderStorageKey)

    // Query types
    /*
    let types = await serviceProviderFactory.getValidServiceTypes()
    await Promise.all(
      types.map(
        async (t) => {
          let info = await serviceProviderFactory.getServiceStakeInfo(t)
          console.log(info)
          let minStake = fromBn(info[0])
          let maxStake = fromBn(info[1])
          console.log(fromWei(info[0]))
          console.log(fromWei(info[1]))
        }
      )
    )
    */

    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address)

    // Permission sp factory as caller, from the proxy owner address
    // (which happens to equal treasury in this test case)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address, { from: proxyOwner })

    // Transfer 1000 tokens to accounts[1]
    // console.log(`Transferring to ${accounts[1]}`)
    await token.transfer(accounts[1], INITIAL_BAL, { from: treasuryAddress })
    // let accountBal = await token.balanceOf(accounts[1])
    // console.log(`${accounts[1]} - ${fromWei(accountBal)} AUD`)
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
      let initialBal = await token.balanceOf(stakerAccount)

      regTx = await registerServiceProvider(
        testServiceType,
        testEndpoint,
        DEFAULT_AMOUNT,
        stakerAccount)

      // Confirm event has correct amount
      assert.equal(regTx.stakedAmountInt, DEFAULT_AMOUNT)

      // Confirm balance updated for tokens
      let finalBal = await token.balanceOf(stakerAccount)
      assert.isTrue(initialBal.eq(finalBal.add(DEFAULT_AMOUNT)), 'Expect funds to be transferred')

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

      let spTypeInfo = await serviceProviderFactory.getServiceStakeInfo(testServiceType)
      let typeMin = fromWei(spTypeInfo[0])
      let typeMax = fromWei(spTypeInfo[1])

      // Validate min stake requirements
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
    it('fails to register endpoint w/less than minimum stake', async () => {
      await token.transfer(
        stakerAccount2,
        MIN_STAKE_AMOUNT - 1,
        { from: treasuryAddress })

      // Attempt to register first endpoint with zero stake
      await _lib.assertRevert(
        registerServiceProvider(
          testServiceType,
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
          testServiceType,
          testEndpoint1,
          0,
          stakerAccount2),
        'Minimum stake threshold exceeded')
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
        web3.utils.toBN(decreaseStakeAmount),
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
      let increaseAmt = DEFAULT_AMOUNT
      let initialBal = await token.balanceOf(stakerAccount)
      let initialStake = await getStakeAmountForAccount(stakerAccount)

      let registerInfo = await registerServiceProvider(
        testServiceType,
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
  })
})
