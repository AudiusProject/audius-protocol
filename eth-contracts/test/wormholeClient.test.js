import * as _lib from '../utils/lib.js'

const MockWormhole = artifacts.require('MockWormhole')
const WormholeClient = artifacts.require('WormholeClient')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')
const wormholeClientProxyKey = web3.utils.utf8ToHex('WormholeClientProxy')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)

contract('WomrholeClient', async (accounts) => {
  let registry, governance, token, wormholeClient0, wormholeClientProxy, wormholeClient
  let mockWormhole

  const [, proxyAdminAddress, proxyDeployerAddress, staker, newUpdateAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

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

    wormholeClient0 = await WormholeClient.new({ from: proxyDeployerAddress })
    const wormholeClientInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, mockWormhole.address]
    )
    wormholeClientProxy = await AudiusAdminUpgradeabilityProxy.new(
      wormholeClient0.address,
      governance.address,
      wormholeClientInitializeCallData,
      { from: proxyDeployerAddress }
    )
    wormholeClient = await WormholeClient.at(wormholeClientProxy.address)

    // Register claimsManagerProxy
    await registry.addContract(wormholeClientProxyKey, wormholeClientProxy.address, { from: proxyDeployerAddress })
  })

  it('lock assets', async () => {
    let sender = accounts[10]
    await token.transfer(sender, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    const initialOwnerBalance = await token.balanceOf(sender)
    await token.approve(wormholeClient.address, DEFAULT_AMOUNT, { from: sender })
    let tx = await wormholeClient.lockAssets(
      DEFAULT_AMOUNT,
      Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
      1,
      123,
      true,
      { from: sender }
    )
    assert.isTrue((await token.balanceOf(sender)).eq(initialOwnerBalance.sub(DEFAULT_AMOUNT)), 'sender balance should match')
  })
})
