import * as _lib from '../utils/lib.js'
import * as _signatures from '../utils/signatures.js'

const MockWormhole = artifacts.require('MockWormhole')
const WormholeClient = artifacts.require('WormholeClient')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')
const wormholeClientProxyKey = web3.utils.utf8ToHex('WormholeClientProxy')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)

contract('WormholeClient', async (accounts) => {
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
    const amount = 100
    const chainId = 1 // in ganache, the chain ID the token initializes with is always 1

    const fromAcctPrivKey = Buffer.from('76195632b07afded1ae36f68635b6ff86791bd4579a27ca28ec7e539fed65c0e', 'hex')
    const fromAcct = '0xaaa30A4bB636F15be970f571BcBe502005E9D66b'

    const relayerAcct = accounts[6] // account that calls lockAssets

    const recipient = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

    await token.transfer(fromAcct, amount, { from: tokenOwnerAddress })
    await _lib.permit(token, fromAcct, fromAcctPrivKey, wormholeClient.address, amount, relayerAcct)

    const nonce = (await wormholeClient.nonces(fromAcct)).toNumber()
    const deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 25 // sufficiently far in future
    const digest = _signatures.getLockAssetsDigest(
      'AudiusWormholeClient',
      wormholeClient.address,
      chainId,
      {
        from: fromAcct,
        amount: amount,
        recipient,
        targetChain: 1,
        refundDust: true
      },
      nonce,
      deadline
    )
    const result = _signatures.sign(digest, fromAcctPrivKey)

    await wormholeClient.lockAssets(
      fromAcct,
      amount,
      recipient,
      1,
      true,
      deadline,
      result.v,
      result.r,
      result.s,
      { from: relayerAcct }
    )
  })
})
