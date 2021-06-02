const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const WormholeClient = artifacts.require('WormholeClient')
const Governance = artifacts.require('Governance')

const wormholeClientProxyKey = web3.utils.utf8ToHex('wormholeClientProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress
    const wormholeAddress = config.wormholeAddress

    const tokenAddress = process.env.tokenAddress
    const governanceAddress = process.env.governanceAddress

    const governance = await Governance.at(governanceAddress)

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
