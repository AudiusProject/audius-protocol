const assert = require('assert')
const nock = require('nock')
const helpers = require('./helpers')

const audius0 = helpers.audiusInstance
// const audiusConfig = helpers.audiusLibsConfig
const initializeLibConfig = helpers.initializeLibConfig
const ethContractsConfig = require('../eth-contracts/config.json')
const AudiusLibs = require('../src/index')

const testServiceType = 'discovery-provider'

let token
let ownerWallet
let accounts
let audius1
let audius2
let sp1
let sp2

const assertThrows = async (blockOrPromise, expectedErrorCode, expectedReason) => {
  try {
    (typeof blockOrPromise === 'function') ? await blockOrPromise() : await blockOrPromise
  } catch (error) {
    assert(error.message.search(expectedErrorCode) > -1, `Expected error code "${expectedErrorCode}" but failed with "${error}" instead.`)
    return error
  }
  // assert.fail() for some reason does not have its error string printed 🤷
  assert(false, `Expected "${expectedErrorCode}"${expectedReason ? ` (with reason: "${expectedReason}")` : ''} but it did not fail`)
}

const assertRevert = async (blockOrPromise, expectedReason) => {
  const error = await assertThrows(blockOrPromise, 'revert', expectedReason)
  // console.log(error)
  if (!expectedReason) {
    return
  }
  const expectedMsgFound = error.message.indexOf(expectedReason) >= 0
  assert.equal(expectedMsgFound, true, `Expected revert reason '${expectedReason}' not found. Found ${error.message}`)
}

const getRandomLocalhost = () => {
  return 'http://localhost:' + Math.floor(1000 + Math.random() * 9000)
}

const deregisterAllSPEndpoints = async (libs, account, type) => {
  let idsRegisteredToAddress = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdsFromAddress(
    sp1,
    type)
  await Promise.all(idsRegisteredToAddress.map(async (x) => {
    let idsRegisteredToAddress = x
    let prevSpInfo = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfo(
      type,
      idsRegisteredToAddress)
    // Confirm expected return values
    assert(prevSpInfo.hasOwnProperty('owner'), `Expected owner, found ${JSON.stringify(prevSpInfo)}`)
    assert(prevSpInfo.hasOwnProperty('endpoint'), `Expected endpoint, found ${JSON.stringify(prevSpInfo)}`)
    assert(prevSpInfo.hasOwnProperty('spID'), `Expected spID, found ${JSON.stringify(prevSpInfo)}}`)
    assert(prevSpInfo.hasOwnProperty('type'), `Expected type, found ${JSON.stringify(prevSpInfo)}`)
    assert(prevSpInfo.hasOwnProperty('blocknumber'), `Expected blocknumber, found ${JSON.stringify(prevSpInfo)}`)
    assert(prevSpInfo.hasOwnProperty('stakeAmount'), `Expected stakeAmount, found ${JSON.stringify(prevSpInfo)}`)
    let tx = await libs.ethContracts.ServiceProviderFactoryClient.deregister(
      type,
      prevSpInfo.endpoint)
  }))
}

const clearAllRegisteredEndpoints = async () => {
  try {
    // Deregister any previously registered endpoints
    await deregisterAllSPEndpoints(audius1, sp1, testServiceType)
    await deregisterAllSPEndpoints(audius2, sp2, testServiceType)
  } catch (e) {
    console.log(`Error deregistering: ${e}`)
  }
}

describe('Staking tests', () => {
  const addressToLibs = {}
  before(async function () {
    await audius0.init()
    token = audius0.ethContracts.AudiusTokenClient
    accounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()

    // Reset min stake
    await audius0.ethContracts.StakingProxyClient.setMinStakeAmount(0)

    ownerWallet = accounts[0]
    sp1 = accounts[1]
    sp2 = accounts[2]

    // Initialize more lib instances
    let libsConfig1 = await initializeLibConfig(sp1)
    assert(
      ethContractsConfig.ownerWallet !== libsConfig1.ownerWallet,
      'New wallet addr')
    audius1 = new AudiusLibs(libsConfig1)
    await audius1.init()

    let libsConfig2 = await initializeLibConfig(accounts[2])
    assert(
      ethContractsConfig.ownerWallet !== libsConfig2.ownerWallet,
      'New wallet addr')
    audius2 = new AudiusLibs(libsConfig2)
    await audius2.init()

    // Refund test accounts
    await token.transfer(sp1, 10000)
    await token.transfer(sp2, 10000)

    addressToLibs[ownerWallet] = audius0
    addressToLibs[sp1] = audius1
    addressToLibs[sp2] = audius2
  })

  beforeEach(async () => {
    let currentlyStaked = await audius0.ethContracts.StakingProxyClient.totalStaked()
    console.log(`Currently staked ${currentlyStaked}`)
    await clearAllRegisteredEndpoints()
  })

  after(async () => {
    let sp1Balance = await token.balanceOf(sp1)
    let sp2Balance = await token.balanceOf(sp2)

    // Drain test balance
    await audius1.ethContracts.AudiusTokenClient.transfer(
      ownerWallet,
      sp1Balance)

    await audius2.ethContracts.AudiusTokenClient.transfer(
      ownerWallet,
      sp2Balance)

    // Confirm no balance remaining in test account wallets
    sp1Balance = await token.balanceOf(sp1)
    sp2Balance = await token.balanceOf(sp2)
    assert.equal(sp1Balance, 0)
    assert.equal(sp2Balance, 0)

    await clearAllRegisteredEndpoints()
    let accounts = [ownerWallet, sp1, sp2]
    console.log('Cleaning up remaining stake')
    await Promise.all(
      accounts.map(async (x) => {
        let account = x
        console.log(`Cleaning up ${x}`)
        let accountStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(account)
        console.log(`Account ${account} has ${accountStake}`)
        let accountLibs = addressToLibs[account]
        let idsRegisteredToAddress = await accountLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdsFromAddress(
          account,
          testServiceType)
        console.log(`Account ${account} IDs - ${idsRegisteredToAddress}`)
      })
    )
    let currentlyStaked = await audius0.ethContracts.StakingProxyClient.totalStaked()
    assert.equal(
      currentlyStaked,
      0,
      `Expect no stake on finish - found ${currentlyStaked}`)
    console.log('After all')
  })

  it('initial staking contract state', async function () {
    let tokenAddr = await audius0.ethContracts.StakingProxyClient.token()
    assert(token.contractAddress, tokenAddr, 'Expect correct token address from staking proxy')
    let supportsHistory = await audius0.ethContracts.StakingProxyClient.supportsHistory()
    assert.equal(supportsHistory, true, 'History support required')
    let currentlyStaked = await audius0.ethContracts.StakingProxyClient.totalStaked()
    assert.equal(
      currentlyStaked,
      0,
      `Expect no stake on init - found ${currentlyStaked}`)
  })

  describe('Registration', () => {
    let initialSPBalance
    let testEndpt
    let testEndpt2
    let defaultStake = 200
    let initialStake = 0

    beforeEach(async () => {

      // Clear any accounts registered w/the audius1 account
      initialSPBalance = await token.balanceOf(sp1)

      // Refund account if necessary
      if (initialSPBalance < defaultStake) {
        await token.transfer(sp1, 1000)
        initialSPBalance = await token.balanceOf(sp1)
      }

      testEndpt = getRandomLocalhost()
      nock(testEndpt)
        .get('/version')
        .reply(200, {
          service: testServiceType,
          version: '0.0.1'
        })

      console.log(`Querying initial stake for ${sp1} - token balance ${initialSPBalance}`)
      // Cache stake amount prior to register
      initialStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      console.log(`Initial stake for ${sp1} - ${initialStake}`)
      console.log(`Registering ${testEndpt}`)

      // Register
      let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
        testServiceType,
        testEndpt,
        defaultStake
      )
      console.log(`Setup complete ${testEndpt}`)
      // TOOD: validate tx
      // console.dir(tx, {depth:5})
    })

    it('register service provider + stake', async function () {
      assert.equal(
        initialSPBalance - defaultStake,
        await token.balanceOf(sp1),
        'Expect decrease in bal')
      assert.equal(
        await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
        initialStake + defaultStake,
        'Expect increase in stake')
    })

    it('increases service provider stake', async function () {
      let preIncreaseBalance = await token.balanceOf(sp1)
      let preIncreaseStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      let tx = await audius1.ethContracts.ServiceProviderFactoryClient.increaseStake(
        testServiceType,
        testEndpt,
        defaultStake)
      //console.dir(tx, {depth:5})

      assert.equal(
        preIncreaseBalance - defaultStake,
        await token.balanceOf(sp1),
        'Expect decrease in balance')
      assert.equal(
        preIncreaseStake + defaultStake,
        await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
        'Expect increase in stake')

      // Confirm revert occurred for incorrect owner
      assertRevert(
        audius2.ethContracts.ServiceProviderFactoryClient.increaseStake(
          testServiceType,
          testEndpt,
          defaultStake),
          "incorrect owner")
      let tx2 = await audius1.ethContracts.ServiceProviderFactoryClient.increaseStake(
        testServiceType,
        testEndpt,
        defaultStake)
      //console.dir(tx2, {depth: 5})
    })

    it('decreases service provider stake', async () => {
      let preDecreaseBal = await token.balanceOf(sp1)
      let preDecreaseStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      let decreaseAmount = defaultStake / 2
      let tx = await audius1.ethContracts.ServiceProviderFactoryClient.decreaseStake(
        testServiceType,
        testEndpt,
        decreaseAmount)

      assert.equal(
        preDecreaseBal + decreaseAmount,
        await token.balanceOf(sp1),
        'Expect increase in balance')
      assert.equal(
        preDecreaseStake - decreaseAmount,
        await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
        'Expect decrease in stake')

      assertRevert(
        audius2.ethContracts.ServiceProviderFactoryClient.decreaseStake(
          testServiceType,
          testEndpt,
          decreaseAmount),
        'incorrect owner')

      let currentStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      // Configure amount greater than current stake to try and decrease
      let invalidDecreaseAmount = currentStake + 10
      assertRevert(
        audius1.ethContracts.ServiceProviderFactoryClient.decreaseStake(
          testServiceType,
          testEndpt,
          invalidDecreaseAmount),
        'Cannot reduce stake amount below zero'
      )
    })

    it('deregisters service provider + recover stake', async function () {
      assert.equal(
        initialSPBalance - defaultStake,
        await token.balanceOf(sp1),
        'Expect decrease in bal')

      let preDeregisterStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      nock(testEndpt)
        .get('/version')
        .reply(200, {
          service: testServiceType,
          version: '0.0.1'
        })

      let tx = await audius1.ethContracts.ServiceProviderFactoryClient.deregister(
        testServiceType,
        testEndpt)

      assert.equal(
        initialSPBalance,
        await token.balanceOf(sp1),
        'Expect stake returned after deregistration')

      assert.equal(
        preDeregisterStake - defaultStake,
        await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
        'Expect decrease in stake after deregistration')
    })

    it('funds new claim', async function () {
      let treasuryAddress = ownerWallet
      let stakedTreasuryBalance = await audius0.ethContracts.StakingProxyClient.totalStakedFor(treasuryAddress)
      assert.strictEqual(
        stakedTreasuryBalance,
        0,
        'no treasury bal expected')
      let initialClaimAmount = 100000
      let tx = await audius0.ethContracts.StakingProxyClient.fundNewClaim(initialClaimAmount)
      assert.strictEqual(
        await audius1.ethContracts.StakingProxyClient.totalStakedFor(treasuryAddress),
        initialClaimAmount,
        'Expect all claim funds in treasury')

      let initialSP1Stake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      console.log(`Initial stake for sp1 ${initialSP1Stake}`)

      let claimTx = await audius1.ethContracts.StakingProxyClient.makeClaim()
      let finalSP1Stake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
      console.log(`Final stake for sp1 ${finalSP1Stake}`)

      assert.strictEqual(
        finalSP1Stake,
        initialSP1Stake + initialClaimAmount,
        'Expect full claim transfer to sp1')

      // Confirm treasury has been emptied
      stakedTreasuryBalance = await audius0.ethContracts.StakingProxyClient.totalStakedFor(treasuryAddress)
      assert.strictEqual(
        stakedTreasuryBalance,
        0,
        'no treasury bal expected')
    })
  })
})

