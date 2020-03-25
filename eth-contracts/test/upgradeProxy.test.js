import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const StakingTest = artifacts.require('StakingTest')
const AudiusToken = artifacts.require('AudiusToken')

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

contract('Upgrade proxy test', async (accounts) => {
  let treasuryAddress = accounts[0]
  let testStakingCallerAddress = accounts[6] // Dummy stand in for sp factory in actual deployment
  let proxyOwner = treasuryAddress
  let proxy
  let impl0
  let impl1
  let token
  let initializeData
  let staking0
  let staking1

  const approveAndStake = async (amount, staker, staking) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: treasuryAddress })
    // allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // stake tokens
    await staking.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(''),
      { from: testStakingCallerAddress })
  }

  beforeEach(async function () {
    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })
    token = await AudiusToken.new({ from: accounts[0] })
    impl0 = await Staking.new()
    impl1 = await StakingTest.new()
    // Create initialization data
    initializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, treasuryAddress])

    staking0 = await Staking.at(proxy.address)
    staking1 = await StakingTest.at(proxy.address)
  })

  it('upgradeTo', async () => {
    await proxy.upgradeTo(impl0.address)
    const implementation = await proxy.implementation()
    assert.equal(implementation, impl0.address)
  })

  it('upgradeToAndCall', async () => {
    await proxy.upgradeToAndCall(impl0.address, initializeData, { from: proxyOwner })
    const implementation = await proxy.implementation()
    assert.equal(implementation, impl0.address)
  })

  describe('initial staking function provided', function () {
    beforeEach(async function () {
      const spAccount1 = accounts[1]
      const spAccount2 = accounts[2]

      // Transfer 1000 tokens to accounts[1] and accounts[2]
      await token.transfer(spAccount1, 1000, { from: treasuryAddress })
      await token.transfer(spAccount2, 1000, { from: treasuryAddress })

      await proxy.upgradeToAndCall(impl0.address, initializeData, { from: proxyOwner })

      // Permission test address as caller
      await staking0.setStakingOwnerAddress(testStakingCallerAddress, { from: treasuryAddress })
    })

    it('upgrade and confirm initial staking state at proxy', async () => {
      const implementation = await proxy.implementation()
      assert.equal(implementation, impl0.address)
      assert.equal(await staking0.hasInitialized(), true, 'contract has not been initialized')
      assert.equal(await staking0.token(), token.address, 'Token is wrong')
      assert.equal((await staking0.totalStaked()).valueOf(), 0, 'Initial total staked amount should be zero')
      assert.equal(await staking0.supportsHistory(), true, 'history support should match')
    })

    it('fails to invoke unknown function', async () => {
      const implementation = await proxy.implementation()
      assert.equal(implementation, impl0.address)
      _lib.assertRevert(staking1.testFunction())
    })

    it('successfully upgrades contract', async () => {
      await proxy.upgradeTo(impl1.address, { from: proxyOwner })
      let tx = await staking1.testFunction()
      let testEventCheck = tx.logs.find(log => log.event === 'TestEvent').args
      assert.isTrue(testEventCheck.msg.length > 0, 'Expect TestEvent to be fired')
    })

    it('successfully upgrades contract and transfers state', async () => {
      await approveAndStake(DEFAULT_AMOUNT, accounts[1], staking0)
      await proxy.upgradeTo(impl1.address, { from: proxyOwner })

      let tx = await staking1.testFunction()
      let testEventCheck = tx.logs.find(log => log.event === 'TestEvent').args
      assert.isTrue(testEventCheck.msg.length > 0, 'Expect TestEvent to be fired')

      let totalStakedAfterUpgrade = await staking1.totalStaked()
      assert.isTrue(
        DEFAULT_AMOUNT.eq(totalStakedAfterUpgrade),
        'total staked amount should transfer after upgrade')

      let accountStakeAfterUpgrade = await staking1.totalStakedFor(accounts[1])
      assert.isTrue(
        DEFAULT_AMOUNT.eq(accountStakeAfterUpgrade),
        'total staked for accounts[1] should match after upgrade')
    })
  })
})
