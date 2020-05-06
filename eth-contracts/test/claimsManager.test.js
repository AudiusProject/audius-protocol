import * as _lib from './_lib/lib.js'
const encodeCall = require('../utils/encodeCall')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const MockDelegateManager = artifacts.require('MockDelegateManager')
const MockStakingCaller = artifacts.require('MockStakingCaller')
const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ClaimsManager = artifacts.require('ClaimsManager')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')

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

contract('ClaimsManager', async (accounts) => {
  let token, registry, staking0, stakingProxy, staking, claimsManager0, claimsManagerProxy, claimsManager
  let mockDelegateManager, mockStakingCaller

  const BN = web3.utils.BN
  const [controllerAddress, proxyAdminAddress, proxyDeployerAddress, staker] = accounts

  const getLatestBlock = async () => {
    return web3.eth.getBlock('latest')
  }

  const approveTransferAndStake = async (amount, staker) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: controllerAddress })
    // Allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // Stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(''))
  }

  beforeEach(async () => {
    token = await AudiusToken.new({ from: controllerAddress })
    await token.initialize()
    registry = await Registry.new({ from: controllerAddress })
    await registry.initialize()

    // Deploy and register stakingProxy
    staking0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        registry.address,
        claimsManagerProxyKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )
    stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: controllerAddress })
    staking = await Staking.at(stakingProxy.address)

    // Mock SP for test
    mockStakingCaller = await MockStakingCaller.new()
    await mockStakingCaller.initialize(stakingProxy.address, token.address)
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address)

    // Deploy mock delegate manager with only function to forward processClaim call
    mockDelegateManager = await MockDelegateManager.new()
    await mockDelegateManager.initialize(registry.address, claimsManagerProxyKey)
    await registry.addContract(delegateManagerKey, mockDelegateManager.address)

    // Deploy claimsManagerProxy
    claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, controllerAddress, stakingProxyKey, serviceProviderFactoryKey, delegateManagerKey]
    )
    claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      proxyAdminAddress,
      claimsInitializeCallData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)

    // Register claimsManagerProxy
    await registry.addContract(
      claimsManagerProxyKey,
      claimsManagerProxy.address
    )

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimsManagerProxy.address, { from: accounts[0] })
  })

  it('Initiate a claim', async () => {
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero treasury stake prior to claim funding'
    )

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    // Get funds per claim
    let fundsPerRound = await claimsManager.getFundsPerRound()

    await claimsManager.initiateRound({ from: controllerAddress })
    await mockDelegateManager.testProcessClaim(staker, 0)

    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerRound.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time'
    )

    // Confirm another claim cannot be immediately funded
    await _lib.assertRevert(
      claimsManager.initiateRound({ from: controllerAddress }),
      'Required block difference not met'
    )
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
    let fundsPerClaim = await claimsManager.getFundsPerRound()

    // Initiate round
    await claimsManager.initiateRound({ from: controllerAddress })
    await mockDelegateManager.testProcessClaim(staker, 0)
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded
    await _lib.assertRevert(
      claimsManager.initiateRound({ from: controllerAddress }),
      'Required block difference not met')

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimsManager.getLastFundBlock()
    let claimDiff = await claimsManager.getFundingRoundBlockDiff()
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
    await claimsManager.initiateRound({ from: controllerAddress })
    await mockDelegateManager.testProcessClaim(staker, 0)
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
    let fundsPerClaim = await claimsManager.getFundsPerRound()
    // Get amount staked
    let totalStaked = await staking.totalStaked()
    assert.isTrue(
      totalStaked.isZero(),
      'Expect zero stake prior to claim funding')

    // Stake default amount
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)

    let currentBlock = await getLatestBlock()
    let currentBlockNum = currentBlock.number
    let lastClaimBlock = await claimsManager.getLastFundBlock()
    let claimDiff = await claimsManager.getFundingRoundBlockDiff()
    let twiceClaimDiff = claimDiff.mul(new BN('2'))
    let nextClaimBlock = lastClaimBlock.add(twiceClaimDiff)

    // Advance blocks to the next valid claim
    while (currentBlockNum < nextClaimBlock) {
      await _lib.advanceBlock(web3)
      currentBlock = await getLatestBlock()
      currentBlockNum = currentBlock.number
    }

    // Initiate claim
    await claimsManager.initiateRound({ from: controllerAddress })
    await mockDelegateManager.testProcessClaim(staker, 0)
    totalStaked = await staking.totalStaked()

    assert.isTrue(
      totalStaked.eq(fundsPerClaim.add(DEFAULT_AMOUNT)),
      'Expect single round of funding + initial stake at this time')

    // Confirm another round cannot be immediately funded, despite 2x block diff
    await _lib.assertRevert(
      claimsManager.initiateRound({ from: controllerAddress }),
      'Required block difference not met')
  })

  it('updates funding amount', async () => {
    let currentFunding = await claimsManager.getFundsPerRound()
    let newAmount = toWei(1000)
    assert.isTrue(!newAmount.eq(currentFunding), 'Expect change in funding value')
    await _lib.assertRevert(
      claimsManager.updateFundingAmount(newAmount, { from: accounts[7] }),
      'UpdateFundingAmount only accessible from controllerAddress.'
    )
    await claimsManager.updateFundingAmount(newAmount, { from: controllerAddress })
    let updatedFundingAmount = await claimsManager.getFundsPerRound()
    assert.isTrue(newAmount.eq(updatedFundingAmount), 'Expect updated funding amount')
  })
})
