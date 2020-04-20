import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const MockServiceProviderFactory = artifacts.require('MockServiceProviderFactory')
const ClaimFactory = artifacts.require('ClaimFactory')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

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
  let token, registry, staking0, proxy, staking, claimFactory

  const BN = web3.utils.BN
  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts
  const staker = accounts[3]
  const stakingOwnerAddress = accounts[6] // Dummy stand in for sp factory in actual deployment


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
      { from: stakingOwnerAddress })
  }

  beforeEach(async () => {
    token = await AudiusToken.new({ from: treasuryAddress })
    registry = await Registry.new({ from: treasuryAddress })

    // Set up staking
    staking0 = await Staking.new({ from: proxyAdminAddress })
    const stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, treasuryAddress]
    )
    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(proxy.address)
    await registry.addContract(stakingProxyKey, proxy.address, { from: treasuryAddress })

    // Mock SP for test
    let mockSPFactory = await MockServiceProviderFactory.new({ from: treasuryAddress })
    await registry.addContract(serviceProviderFactoryKey, mockSPFactory.address)

    // Create new claim factory instance
    claimFactory = await ClaimFactory.new(
      token.address,
      registry.address,
      stakingProxyKey,
      serviceProviderFactoryKey,
      { from: treasuryAddress }
    )

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimFactory.address, { from: treasuryAddress })

    // Permission test address as caller
    await staking.setStakingOwnerAddress(stakingOwnerAddress, { from: treasuryAddress })
  })

  it('Initiate a claim', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero treasury stake prior to claim funding')

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerRound = await claimFactory.getFundsPerRound()

    await claimFactory.initiateRound()
    await claimFactory.processClaim(staker, 0)

    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerRound.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateRound(),
      'Required block difference not met')
  })

  it('Initiate multiple rounds, 1x block diff', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerRound()

    // Initiate round
    await claimFactory.initiateRound()
    await claimFactory.processClaim(staker, 0)
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded
    await _lib.assertRevert(
      claimFactory.initiateRound(),
      'Required block difference not met')

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimFactory.getLastFundBlock()
    let claimDiff = await claimFactory.getFundingRoundBlockDiff()
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

    // Initiate another round
    await claimFactory.initiateRound()
    await claimFactory.processClaim(staker, 0)
    totalStaked = await staking.totalStaked()
    let finalAcctStake = await staking.totalStakedFor(staker)
    let expectedFinalValue = accountStakeBeforeSecondClaim.add(fundsPerClaim)

    // Note - we convert ouf of BN format here to handle infinitesimal precision loss
    assert.equal(
      fromBn(finalAcctStake),
      fromBn(expectedFinalValue),
      'Expect additional increase in stake after 2nd claim')
  })

  it('Initiate single claim after 2x claim block diff', async () => {
    // Get funds per claim
    let fundsPerClaim = await claimFactory.getFundsPerRound()
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimFactory.getLastFundBlock()
    let claimDiff = await claimFactory.getFundingRoundBlockDiff()
    let twiceClaimDiff = claimDiff.mul(new BN('2'))
    let nextClaimBlock = lastClaimBlock.add(twiceClaimDiff)

    // Advance blocks to the next valid claim
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await getLatestBlock()
      currentBlockNum = currentBlock.number
    }

    // Initiate claim
    await claimFactory.initiateRound()
    await claimFactory.processClaim(staker, 0)
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded, despite 2x block diff
    await _lib.assertRevert(
      claimFactory.initiateRound(),
      'Required block difference not met')
  })
})
