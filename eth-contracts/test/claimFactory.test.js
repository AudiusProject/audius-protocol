import * as _lib from './_lib/lib.js'

const AudiusToken = artifacts.require('AudiusToken')
const ClaimFactory = artifacts.require('ClaimFactory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const encodeCall = require('./encodeCall')

contract('ClaimFactory', async (accounts) => {
  // Local web3, injected by truffle
  let treasuryAddress = accounts[0]
  let proxyOwner = treasuryAddress
  let claimFactory
  let token

  let staking
  let proxy
  let impl0
  let BN = web3.utils.BN


  const getLatestBlock = async () => {
    return web3.eth.getBlock('latest')
  }

  beforeEach(async () => {
    token = await AudiusToken.new({ from: accounts[0] })
    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })
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

    // Reset min for test purposes
    await staking.setMinStakeAmount(0)

    // Create new claim factory instance
    claimFactory = await ClaimFactory.new(
      token.address,
      proxy.address,
      { from: accounts[0] })

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: accounts[0] })
  })

  it('Initiate a claim', async () => {
    // Get amount staked for treasury
    let stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.isZero(),
      'Expect zero treasury stake prior to claim funding')

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()

    await claimFactory.initiateClaim()
    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect single round of funding staked for treasury at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')
  })

  it('Initiate multiple claims after 1x claim block diff', async () => {
    // Get amount staked for treasury
    let stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.isZero(),
      'Expect zero treasury stake prior to claim funding')

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()

    // Initiate claim
    await claimFactory.initiateClaim()
    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect single round of funding staked for treasury at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimFactory.getLastClaimedBlock()
    let claimDiff = await claimFactory.getClaimBlockDifference()
    let nextClaimBlock = lastClaimBlock.add(claimDiff)

    // Advance blocks to the next valid claim
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await getLatestBlock()
      currentBlockNum = currentBlock.number
    }

    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect treasury stake equal to single fund amount')

    // Initiate another claim
    await claimFactory.initiateClaim()
    let treasuryStakeSecondClaim = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      treasuryStakeSecondClaim.eq(stakedForTreasury.mul(new BN('2'))),
      'Expect 2 rounds of funding staked for treasury at this time')
  })

  it('Initiate multiple claims after 1x claim block diff', async () => {
    // Get amount staked for treasury
    let stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.isZero(),
      'Expect zero treasury stake prior to claim funding')

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()

    // Initiate claim
    await claimFactory.initiateClaim()
    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect single round of funding staked for treasury at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimFactory.getLastClaimedBlock()
    let claimDiff = await claimFactory.getClaimBlockDifference()
    let nextClaimBlock = lastClaimBlock.add(claimDiff)

    // Advance blocks to the next valid claim
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await getLatestBlock()
      currentBlockNum = currentBlock.number
    }

    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect treasury stake equal to single fund amount')

    // Initiate another claim
    await claimFactory.initiateClaim()
    let treasuryStakeSecondClaim = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      treasuryStakeSecondClaim.eq(stakedForTreasury.mul(new BN('2'))),
      'Expect 2 rounds of funding staked for treasury at this time')
  })

  it('Initiate multiple claims consecutively after 2x claim block diff', async () => {
    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()
    // Get amount staked for treasury
    let stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.isZero(),
      'Expect zero treasury stake prior to claim funding')

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimFactory.getLastClaimedBlock()
    let claimDiff = await claimFactory.getClaimBlockDifference()
    let twiceClaimDiff = claimDiff.mul(new BN('2'))
    let nextClaimBlock = lastClaimBlock.add(twiceClaimDiff)

    // Advance blocks to the next valid claim
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await getLatestBlock()
      currentBlockNum = currentBlock.number
    }

    // Initiate claim
    await claimFactory.initiateClaim()
    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect single round of funding staked for treasury at this time')

    stakedForTreasury = await staking.totalStakedFor(treasuryAddress)
    assert.isTrue(
      stakedForTreasury.eq(fundsPerClaim),
      'Expect treasury stake equal to single fund amount')

    // Initiate another claim
    await claimFactory.initiateClaim()
    let treasuryStakeSecondClaim = await staking.totalStakedFor(treasuryAddress)

    assert.isTrue(
      treasuryStakeSecondClaim.eq(stakedForTreasury.mul(new BN('2'))),
      'Expect 2 rounds of funding staked for treasury at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')
  })
})
