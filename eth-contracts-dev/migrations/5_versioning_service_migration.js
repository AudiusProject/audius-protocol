const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')
const VersioningStorage = artifacts.require('VersioningStorage')
const VersioningFactory = artifacts.require('VersioningFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const Staking = artifacts.require('Staking')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

const versioningStorageKey = web3.utils.utf8ToHex('VersioningStorage')
const versioningFactoryKey = web3.utils.utf8ToHex('VersioningFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

const AudiusToken = artifacts.require('AudiusToken')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()
    const networkId = Registry.network_id
    const config = contractConfig[network]

    const versionerAddress = config.versionerAddress || accounts[0]
    const treasuryAddress = config.treasuryAddress || accounts[0]
    const tokenAddress = AudiusToken.address

    await deployer.deploy(VersioningStorage, Registry.address)
    await registry.addContract(versioningStorageKey, VersioningStorage.address)
    await deployer.deploy(VersioningFactory, Registry.address, versioningStorageKey, versionerAddress)
    await registry.addContract(versioningFactoryKey, VersioningFactory.address)

    await deployer.deploy(ServiceProviderStorage, Registry.address)
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address)

    let serviceProviderFactory = await deployer.deploy(
      ServiceProviderFactory,
      Registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderStorageKey)

    await registry.addContract(serviceProviderFactoryKey, ServiceProviderFactory.address)

    // Configure owner of staking contract to be service provider factory
    let proxy = await OwnedUpgradeabilityProxy.deployed()
    let staking = await Staking.at(proxy.address)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address)
  })
}
