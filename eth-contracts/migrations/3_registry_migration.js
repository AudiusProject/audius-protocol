const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    // Deploy Registry logic and proxy contracts
    const registry0 = await deployer.deploy(Registry, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall('initialize', [], [])
    const registryProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      registry0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    // Export to env for reference in future migrations
    process.env.registryAddress = registryProxy.address
  })
}
