const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')
const VersioningStorage = artifacts.require('VersioningStorage')
const VersioningFactory = artifacts.require('VersioningFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')

const versioningStorageKey = web3.utils.utf8ToHex('VersioningStorage')
const versioningFactoryKey = web3.utils.utf8ToHex('VersioningFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    let registry = await Registry.deployed()
    const networkId = Registry.network_id
    const config = contractConfig[network]

    const versionerAddress = config.versionerAddress || accounts[0]

    await deployer.deploy(VersioningStorage, Registry.address)
    await registry.addContract(versioningStorageKey, VersioningStorage.address)
    await deployer.deploy(VersioningFactory, Registry.address, versioningStorageKey, versionerAddress)
    await registry.addContract(versioningFactoryKey, VersioningFactory.address)

    await deployer.deploy(ServiceProviderStorage, Registry.address)
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address)
    await deployer.deploy(ServiceProviderFactory, Registry.address, serviceProviderStorageKey)
    await registry.addContract(serviceProviderFactoryKey, ServiceProviderFactory.address)
  })
}
