import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const StakingUpgraded = artifacts.require('StakingUpgraded')
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
  // let staking, stakingUpgraded, stakingInitializeData, token, proxy, stakingInstance
  let token, staking0, stakingInitializeData, proxy, stakingUpgraded, staking

  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts
  const stakingOwnerAddress = accounts[9] // Dummy stand in for sp factory in actual deployment

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
      { from: stakingOwnerAddress }
    )
  }

  beforeEach(async function () {
    token = await AudiusToken.new({ from: treasuryAddress })
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingUpgraded = await StakingUpgraded.new({ from: proxyAdminAddress })
    assert.notEqual(staking0.address, stakingUpgraded.address)
    stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, treasuryAddress]
    )
  })

  it('deploy proxy', async () => {
    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    staking = await Staking.at(proxy.address)
    const totalStaked = await staking.totalStaked.call({ from: proxyDeployerAddress })
    assert.equal(fromBn(totalStaked), 0)

    assert.equal(await proxy.implementation.call({ from: proxyAdminAddress }), staking0.address)
  })

  it('fail to call newFunction before upgrade', async () => {
    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    staking = await StakingUpgraded.at(proxy.address)
    await _lib.assertRevert(staking.newFunction.call({ from: proxyDeployerAddress }))
  })

  it('upgrade proxy to StakingUpgraded + call newFunction()', async () => {
    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    // assert proxy.newFunction() not callable before upgrade
    staking = await StakingUpgraded.at(proxy.address)
    await _lib.assertRevert(staking.newFunction.call({ from: proxyDeployerAddress }))

    await proxy.upgradeTo(stakingUpgraded.address, { from: proxyAdminAddress })
    assert.equal(await proxy.implementation.call({ from: proxyAdminAddress }), stakingUpgraded.address)

    // assert proxy.newFunction() call succeeds after upgrade
    staking = await StakingUpgraded.at(proxy.address)
    const newFunctionResp = await staking.newFunction.call({ from: proxyDeployerAddress })
    assert.equal(newFunctionResp, 5)
  })

  describe('Confirm staking logic', function () {
    beforeEach(async function () {
      const spAccount1 = accounts[3]
      const spAccount2 = accounts[4]

      // Transfer 1000 tokens to accounts[1] and accounts[2]
      await token.transfer(spAccount1, 1000, { from: treasuryAddress })
      await token.transfer(spAccount2, 1000, { from: treasuryAddress })

      proxy = await AdminUpgradeabilityProxy.new(
        staking0.address,
        proxyAdminAddress,
        stakingInitializeData,
        { from: proxyDeployerAddress }
      )

      // Permission test address as caller
      staking = await Staking.at(proxy.address)
      await staking.setStakingOwnerAddress(stakingOwnerAddress, { from: treasuryAddress })
    })

    it('upgrade and confirm initial staking state at proxy', async () => {
      assert.equal(await proxy.implementation.call({ from: proxyAdminAddress }), staking0.address)
      assert.equal(await staking.initializerRan.call({ from: accounts[3]}), true, 'contract has not been initialized')
      assert.equal(await staking.token.call({ from: accounts[3] }), token.address, 'Token is wrong')
      assert.equal((await staking.totalStaked.call({ from: accounts[3] })).valueOf(), 0, 'Initial total staked amount should be zero')
      assert.equal(await staking.supportsHistory({ from: accounts[3] }), true, 'history support should match')
    })

    it('Confirm that contract state changes persist after proxy upgrade', async () => {
      const staker = accounts[3]
      const otherAccount = accounts[4]

      await approveAndStake(DEFAULT_AMOUNT, staker, staking)
      await proxy.upgradeTo(stakingUpgraded.address, { from: proxyAdminAddress })

      staking = await StakingUpgraded.at(proxy.address)

      assert.isTrue(
        DEFAULT_AMOUNT.eq(await staking.totalStaked.call({ from: otherAccount })),
        'total staked amount should transfer after upgrade'
      )

      assert.isTrue(
        DEFAULT_AMOUNT.eq(await staking.totalStakedFor.call(staker, { from: otherAccount })),
        'total staked for staker should match after upgrade'
      )
    })
  })
})
