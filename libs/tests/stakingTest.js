const assert = require('assert')
const nock = require('nock')
const helpers = require('./helpers')

const audius0 = helpers.audiusInstance
// const audiusConfig = helpers.audiusLibsConfig
const initializeLibConfig = helpers.initializeLibConfig
const ethContractsConfig = require('../eth-contracts/config.json')
const AudiusLibs = require('../src/index')

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
  assert.equal(expectedMsgFound, true, 'Expected revert reason not found')
}

const getRandomLocalhost = () => {
  return 'http://localhost:' + Math.floor(1000 + Math.random() * 9000)
}

const testDeregisterSPEndpoint = async (libs, account, type) => {
  let previousRegisteredId = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromAddress(
    sp1,
    type)
  let prevSpInfo = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
    type,
    previousRegisteredId)

  let path = '/version'      
  let response = {
    service: type,
    version : '0.0.1'
  }

  if (type === 'discovery-provider') {
    path = '/health_check'
    response = {data: {...response}}
  }

  nock(prevSpInfo.endpoint)
    .get(path)
    .reply(200, response)
  let tx = await libs.ethContracts.ServiceProviderFactoryClient.deregister(
    type,
    prevSpInfo.endpoint)
}

describe('Staking tests', () => {
  let testServiceType = 'discovery-provider'
  before(async function () {
    await audius0.init()
    token = audius0.ethContracts.AudiusTokenClient
    accounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()

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
    await token.transfer(sp1, 1000)
    await token.transfer(sp2, 1000)
  })

  beforeEach(async () => {
    try {
      // Deregister any previously registered endpoints
      await testDeregisterSPEndpoint(audius1, sp1, testServiceType)
      await testDeregisterSPEndpoint(audius2, sp2, testServiceType)
    } catch (e) {
      // console.log(`benign error: ${e}`)
    }
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
  })

  it('initial staking contract state', async function () {
    let tokenAddr = await audius0.ethContracts.StakingProxyClient.token()
    assert(token.contractAddress, tokenAddr, 'Expect correct token address from staking proxy')
    let supportsHistory = await audius0.ethContracts.StakingProxyClient.supportsHistory()
    assert.equal(supportsHistory, true, 'History support required')
    assert.equal(await audius0.ethContracts.StakingProxyClient.totalStaked(), 0, 'Expect no stake on init')
  })

  describe('Registration', () => {
    let initialSPBalance
    let testEndpt
    let testEndpt2
    let defaultStake = 200
    let initialStake = 0

    /* TODO: fix tests;
      note subsequent tests after the first it() test may rreturn
      error message: 
        Error: Returned error: VM Exception while processing transaction: revert Account already has an endpoint registered.

      beforeEach() setup is failing the register() call
    */
    beforeEach(async () => {

      // Clear any accounts registered w/the audius1 account
      initialSPBalance = await token.balanceOf(sp1)
      testEndpt = getRandomLocalhost()

      let path = '/version'      
      let response = {
        service: testServiceType,
        version : '0.0.1'
      }

      if (testServiceType === 'discovery-provider') {
        path = '/health_check'
        response = {data: {...response}}
      }

      nock(testEndpt)
        .get(path)
        .reply(200, response)

      // Cache stake amount prior to register
      initialStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)

      // Register
      let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
        testServiceType,
        testEndpt,
        defaultStake
      )
      // TOOD: validate tx
      // console.dir(tx, {depth:5})
    })

    // it('register service provider + stake', async function () {
    //   assert.equal(
    //     initialSPBalance - defaultStake,
    //     await token.balanceOf(sp1),
    //     'Expect decrease in bal')
    //   assert.equal(
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
    //     initialStake + defaultStake,
    //     'Expect increase in stake')
    // })

    // subsequent tests will fail

    // it('increases service provider stake', async function () {
    //   let preIncreaseBalance = await token.balanceOf(sp1)
    //   let preIncreaseStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
    //   let tx = await audius1.ethContracts.ServiceProviderFactoryClient.increaseStake(
    //     testServiceType,
    //     testEndpt,
    //     defaultStake)
    //   //console.dir(tx, {depth:5})

    //   assert.equal(
    //     preIncreaseBalance - defaultStake,
    //     await token.balanceOf(sp1),
    //     'Expect decrease in balance')
    //   assert.equal(
    //     preIncreaseStake + defaultStake,
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
    //     'Expect increase in stake')

    //   // Confirm revert occurred for incorrect owner
    //   assertRevert(
    //     audius2.ethContracts.ServiceProviderFactoryClient.increaseStake(
    //       testServiceType,
    //       testEndpt,
    //       defaultStake),
    //       "incorrect owner")
    //   let tx2 = await audius1.ethContracts.ServiceProviderFactoryClient.increaseStake(
    //     testServiceType,
    //     testEndpt,
    //     defaultStake)
    //   //console.dir(tx2, {depth: 5})
    // })

    // it('decreases service provider stake', async () => {
    //   let preDecreaseBal = await token.balanceOf(sp1)
    //   let preDecreaseStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
    //   let decreaseAmount = defaultStake / 2
    //   let tx = await audius1.ethContracts.ServiceProviderFactoryClient.decreaseStake(
    //     testServiceType,
    //     testEndpt,
    //     decreaseAmount)

    //   assert.equal(
    //     preDecreaseBal + decreaseAmount,
    //     await token.balanceOf(sp1),
    //     'Expect increase in balance')
    //   assert.equal(
    //     preDecreaseStake - decreaseAmount,
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
    //     'Expect decrease in stake')

    //   assertRevert(
    //     audius2.ethContracts.ServiceProviderFactoryClient.decreaseStake(
    //       testServiceType,
    //       testEndpt,
    //       decreaseAmount),
    //     'incorrect owner')

    //   let currentStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
    //   // Configure amount greater than current stake to try and decrease
    //   let invalidDecreaseAmount = currentStake + 10
    //   assertRevert(
    //     audius1.ethContracts.ServiceProviderFactoryClient.decreaseStake(
    //       testServiceType,
    //       testEndpt,
    //       invalidDecreaseAmount),
    //     'subtraction overflow'
    //   )
    // })

    // it('deregisters service provider + recover stake', async function () {
    //   assert.equal(
    //     initialSPBalance - defaultStake,
    //     await token.balanceOf(sp1),
    //     'Expect decrease in bal')

    //   let preDeregisterStake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
    //   nock(testEndpt)
    //     .get('/version')
    //     .reply(200, {
    //       service: testServiceType,
    //       version: '0.0.1'
    //     })

    //   let tx = await audius1.ethContracts.ServiceProviderFactoryClient.deregister(
    //     testServiceType,
    //     testEndpt)
    //   // console.dir(tx, {depth:5})

    //   assert.equal(
    //     initialSPBalance,
    //     await token.balanceOf(sp1),
    //     'Expect stake returned after deregistration')

    //   assert.equal(
    //     preDeregisterStake - defaultStake,
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
    //     'Expect decrease in stake after deregistration')
    // })

    // it('funds new claim', async function () {
    //   let treasuryAddress = ownerWallet
    //   let stakedTreasuryBalance = await audius0.ethContracts.StakingProxyClient.totalStakedFor(treasuryAddress)
    //   assert.strictEqual(
    //     stakedTreasuryBalance,
    //     0,
    //     'no treasury bal expected')
    //   let initialClaimAmount = 100000
    //   let tx = await audius0.ethContracts.StakingProxyClient.fundNewClaim(initialClaimAmount)
    //   assert.strictEqual(
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(treasuryAddress),
    //     initialClaimAmount,
    //     'Expect all claim funds in treasury')
    //   let initialSP1Stake = await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1)
    //   let claimTx = await audius1.ethContracts.StakingProxyClient.makeClaim()
    //   assert.strictEqual(
    //     await audius1.ethContracts.StakingProxyClient.totalStakedFor(sp1),
    //     initialSP1Stake + initialClaimAmount,
    //     'Expect full claim transfer to sp1')
    // })
  })
})

