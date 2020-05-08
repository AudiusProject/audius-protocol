const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const AudiusToken = artifacts.require('AudiusToken')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    // Deploy AudiusToken logic and proxy contracts
    const token0 = await deployer.deploy(AudiusToken, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall('initialize', [], [])
    const tokenProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      token0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    // Export to env for reference in future migrations
    process.env.tokenAddress = tokenProxy.address
  })
}
