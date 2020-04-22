import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const StakingUpgraded = artifacts.require('StakingUpgraded')
const AudiusToken = artifacts.require('AudiusToken')
const MockStakingCaller = artifacts.require('MockStakingCaller')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

// Registry keys
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

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
  let testStakingCallerAddress = accounts[6] // Dummy stand in for sp factory in actual deployment
  let proxy
  let token
  let staking0
  let staking
  let stakingUpgraded
  let stakingInitializeData
  let mockStakingCaller
  let registry

  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts

  const approveAndStake = async (amount, staker, staking) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: treasuryAddress })
    // allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(''))
  }

  beforeEach(async () => {
    token = await AudiusToken.new({ from: accounts[0] })
    registry = await Registry.new()

    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingUpgraded = await StakingUpgraded.new({ from: proxyAdminAddress })
    assert.notEqual(staking0.address, stakingUpgraded.address)

    // Create initialization data
    stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        treasuryAddress,
        registry.address,
        claimFactoryKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )

    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    // Register mock contract as claimFactory, spFactory, delegateManager
    mockStakingCaller = await MockStakingCaller.new(proxy.address, token.address)
    await registry.addContract(claimFactoryKey, mockStakingCaller.address)
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address)
    await registry.addContract(delegateManagerKey, mockStakingCaller.address)
  })

  it('Fails to call Staking contract function before proxy initialization', async () => {
    const stakingLogic = await Staking.new({ from: proxyAdminAddress })
    _lib.assertRevert(
      stakingLogic.totalStaked.call({ from: proxyDeployerAddress }),
      "revert INIT_NOT_INITIALIZED"
    )
  })

  it('Deployed proxy state', async () => {
    staking = await Staking.at(proxy.address)
    const totalStaked = await staking.totalStaked.call({ from: proxyDeployerAddress })
    assert.equal(totalStaked, 0)
    assert.equal(await proxy.implementation.call({ from: proxyAdminAddress }), staking0.address)
  })

  it('fail to call newFunction before upgrade', async () => {
    staking = await StakingUpgraded.at(proxy.address)
    await _lib.assertRevert(staking.newFunction.call({ from: proxyDeployerAddress }))
  })

  it('upgrade proxy to StakingUpgraded + call newFunction()', async () => {
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

  describe('Test with Staking contract', function () {
    beforeEach(async function () {
      const spAccount1 = accounts[3]
      const spAccount2 = accounts[4]

      // Transfer 1000 tokens to accounts[1] and accounts[2]
      await token.transfer(spAccount1, 1000, { from: treasuryAddress })
      await token.transfer(spAccount2, 1000, { from: treasuryAddress })

      // Permission test address as caller
      staking = await Staking.at(proxy.address)
    })

    it('upgrade and confirm initial staking state at proxy', async () => {
      assert.equal(await proxy.implementation.call({ from: proxyAdminAddress }), staking0.address)
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
