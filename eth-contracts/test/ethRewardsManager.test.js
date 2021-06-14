import * as _lib from '../utils/lib.js'
import * as _signatures from '../utils/signatures.js'

const MockWormhole = artifacts.require('MockWormhole')
const EthRewardsManager = artifacts.require('EthRewardsManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')
const ethRewardsManagerProxyKey = web3.utils.utf8ToHex('EthRewardsManagerProxy')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)
const callValue0 = _lib.toBN(0)

contract('EthRewardsManager', async (accounts) => {
  let registry, governance, token, ethRewardsManager0, ethRewardsManagerProxy, ethRewardsManager
  let mockWormhole

  const [, proxyAdminAddress, proxyDeployerAddress, staker, newUpdateAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress
  const antiAbuseOracle = proxyDeployerAddress
  const recipient = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
  const newRecipient = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')

  const votingPeriod = 10
  const executionDelay = votingPeriod
  const votingQuorumPercent = 10

  beforeEach(async () => {
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress
    )

    token = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )

    // Register token
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    mockWormhole = await MockWormhole.new()

    ethRewardsManager0 = await EthRewardsManager.new({ from: proxyDeployerAddress })
    const ethRewardsManagerInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'address'],
      [token.address, governance.address, mockWormhole.address, recipient, antiAbuseOracle]
    )
    ethRewardsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      ethRewardsManager0.address,
      governance.address,
      ethRewardsManagerInitializeCallData,
      { from: proxyDeployerAddress }
    )
    ethRewardsManagerProxy = await EthRewardsManager.at(ethRewardsManagerProxy.address)

    // Register ethRewardsManagerProxy
    await registry.addContract(ethRewardsManagerProxyKey, ethRewardsManagerProxy.address, { from: proxyDeployerAddress })
  })

  it('governanceAddress', async () => {
    const newGovernance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress
    )

    await _lib.assertRevert(
      ethRewardsManagerProxy.setantiAbuseOracle(newGovernance.address, { from: accounts[7] }),
      'Only governance'
    )

    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        ethRewardsManagerProxyKey,
        callValue0,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [accounts[10]]),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setGovernanceAddress(address)',
      _lib.abiEncode(['address'], [newGovernance.address]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManagerProxy.getGovernanceAddress(), newGovernance.address)
  })

  it('antiAbuseOracle', async () => {
    await _lib.assertRevert(
      ethRewardsManagerProxy.setantiAbuseOracle(accounts[10], { from: accounts[7] }),
      'Only governance'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setantiAbuseOracle(address)',
      _lib.abiEncode(['address'], [accounts[10]]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManagerProxy.antiAbuseOracle(), accounts[10])
  })

  it('recipient', async () => {
    await _lib.assertRevert(
      ethRewardsManagerProxy.setRecipient(newRecipient, { from: accounts[7] }),
      'Only governance'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setRecipient(bytes32)',
      _lib.abiEncode(['bytes32'], [newRecipient]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManagerProxy.getRecipient(), `0x${newRecipient.toString('hex')}`)
  })

  it('transferToSolana', async () => {
    const amount = 100

    await token.transfer(ethRewardsManagerProxy.address, amount, { from: tokenOwnerAddress })
    assert.equal((await token.balanceOf(ethRewardsManagerProxy.address)).toNumber(), amount)

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'transferToSolana(uint32)',
      _lib.abiEncode(['uint32'], [1]),
      { from: guardianAddress }
    )

    assert.equal((await token.balanceOf(ethRewardsManagerProxy.address)).toNumber(), 0)
    assert.equal((await token.balanceOf(mockWormhole.address)).toNumber(), 100)
  })

  it('token', async () => {
    assert.equal(await ethRewardsManagerProxy.token(), token.address)
  })
})
