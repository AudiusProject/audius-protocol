const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const Registry = artifacts.require('Registry')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    // Deploy Registry logic and proxy contracts
    const registry0 = await deployer.deploy(Registry, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall('initialize', [], [])
    const registryProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      registry0.address,
      proxyAdminAddress,
      initializeCallData,
      _lib.addressZero,
      { from: proxyDeployerAddress }
    )
    const registry = await Registry.at(registryProxy.address)

    assert.equal(await registry.owner.call(), proxyDeployerAddress)
    assert.equal(await registryProxy.getAudiusGovernanceAddress.call(), _lib.addressZero)

    // Export to env for reference in future migrations
    process.env.registryAddress = registry.address
  })
}
