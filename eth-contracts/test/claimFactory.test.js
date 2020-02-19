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
  let token
  let claimFactory

  let proxy
  let impl0

  const getLatestBlock = async () => {
    let block = await web3.eth.getBlock('latest')
    return block.number
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

    let staking = await Staking.at(proxy.address)

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

  it('Initiates a claim', async () => {
    // Mint tokens
    let info = await claimFactory.getClaimInformation()
    console.log(info)
    console.log(info.lastClaimedBlock.toNumber())

    await claimFactory.initiateClaim()
    // let claimFactoryBalance = await token.balanceOf(claimFactory.address)

    info = await claimFactory.getClaimInformation()
    let claimBlockDiff = info.claimBlockDifference.toNumber()
    let currentLatestBlock = await getLatestBlock()
    let minimumNextBlock = currentLatestBlock + claimBlockDiff
    console.log(`Claim block diff - ${claimBlockDiff}`)
    console.log(currentLatestBlock)
    console.log(`Minimum next block - ${minimumNextBlock}`)

    await _lib.assertRevert(
      claimFactory.initiateClaim(),
      'Required block difference not met')
  })
})
