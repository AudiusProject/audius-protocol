const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const WormholeClient = artifacts.require('WormholeClient')
const Governance = artifacts.require('Governance')
const MockWormhole = artifacts.require('MockWormhole')
const wormholeClientProxyKey = web3.utils.utf8ToHex('WormholeClientProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress
    let wormholeAddress = config.wormholeAddress

    const tokenAddress = process.env.tokenAddress
    const governanceAddress = process.env.governanceAddress

    const governance = await Governance.at(governanceAddress)

    if (wormholeAddress === null) {
      const mockWormhole = await deployer.deploy(MockWormhole, { from: proxyDeployerAddress })
      wormholeAddress = mockWormhole.address
    }

    // Deploy WormholeClient logic and proxy contracts + register proxy
    const wormholeClient0 = await deployer.deploy(WormholeClient, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenAddress, wormholeAddress]
    )

    const wormholeClientProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      wormholeClient0.address,
      governanceAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    const wormholeClient = await WormholeClient.at(wormholeClientProxy.address)
    _lib.registerContract(governance, wormholeClientProxyKey, wormholeClientProxy.address, guardianAddress)

    // Set environment variable
    process.env.wormholeClientAddress = wormholeClientProxy.address
  })
}
