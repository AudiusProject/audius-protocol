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
  const botOracle = proxyDeployerAddress
  const recipient = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

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
      [token.address, governance.address, mockWormhole.address, recipient, botOracle]
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

  it('botOracle', async () => {
    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setBotOracle(address)',
      _lib.abiEncode(['address'], [accounts[10]]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManagerProxy.botOracle(), accounts[10])
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
