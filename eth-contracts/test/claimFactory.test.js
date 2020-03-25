import * as _lib from './_lib/lib.js'

const AudiusToken = artifacts.require('AudiusToken')
const ClaimFactory = artifacts.require('ClaimFactory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const encodeCall = require('./encodeCall')

const fromBn = n => parseInt(n.valueOf(), 10)

const toWei = (aud) => {
  let amountInAudWei = web3.utils.toWei(
    aud.toString(),
    'ether'
  )

  let amountInAudWeiBN = web3.utils.toBN(amountInAudWei)
  return amountInAudWeiBN
}

const DEFAULT_AMOUNT = toWei(120)

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
  let testStakingCallerAddress = accounts[6] // Dummy stand in for sp factory in actual deployment


  const getLatestBlock = async () => {
    return web3.eth.getBlock('latest')
  }

  const approveTransferAndStake = async (amount, staker) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: treasuryAddress })
    // Allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // Stake tokens
    await staking.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(''),
      { from: testStakingCallerAddress })
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

    // Create new claim factory instance
    claimFactory = await ClaimFactory.new(
      token.address,
      proxy.address,
      { from: accounts[0] })

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: accounts[0] })

    // Permission test address as caller
    await staking.setStakingOwnerAddress(testStakingCallerAddress, { from: treasuryAddress })
  })

  it('Initiate a claim', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero treasury stake prior to claim funding')

    // Stake default amount
    let staker = accounts[2]
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()

    await claimFactory.initiateClaim()
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')
  })

  it('Initiate multiple claims after 1x claim block diff', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    let staker = accounts[2]
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()

    // Initiate claim
    await claimFactory.initiateClaim()
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

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

    // No change expected after block diff
    totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    let accountStakeBeforeSecondClaim = await staking.totalStakedFor(staker)

    // Initiate another claim
    await claimFactory.initiateClaim()
    totalStaked = await staking.totalStaked()
    let finalAcctStake = await staking.totalStakedFor(staker)
    let expectedFinalValue = accountStakeBeforeSecondClaim.add(fundsPerClaim)

    // Note - we convert ouf of BN format here to handle infinitesimal precision loss
    assert.equal(
      fromBn(finalAcctStake),
      fromBn(expectedFinalValue),
      'Expect additional increase in stake after 2nd claim')
  })

  it('Initiate multiple claims consecutively after 2x claim block diff', async () => {
    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerClaim()
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    let staker = accounts[2]
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

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
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    let accountStakeBeforeSecondClaim = await staking.totalStakedFor(staker)

    // Initiate another claim
    await claimFactory.initiateClaim()
    totalStaked = await staking.totalStaked()
    let finalAcctStake = await staking.totalStakedFor(staker)
    let expectedFinalValue = accountStakeBeforeSecondClaim.add(fundsPerClaim)

    // Note - we convert ouf of BN format here to handle infinitesimal precision loss
    assert.equal(
      fromBn(finalAcctStake),
      fromBn(expectedFinalValue),
      'Expect additional increase in stake after 2nd claim')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')
  })
})
