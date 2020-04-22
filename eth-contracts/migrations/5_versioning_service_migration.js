const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')
const VersioningStorage = artifacts.require('VersioningStorage')
const VersioningFactory = artifacts.require('VersioningFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const Staking = artifacts.require('Staking')

const versioningStorageKey = web3.utils.utf8ToHex('VersioningStorage')
const versioningFactoryKey = web3.utils.utf8ToHex('VersioningFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')


module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const registry = await Registry.deployed()

    const versionerAddress = config.versionerAddress || accounts[0]

    await deployer.deploy(VersioningStorage, Registry.address)
    await registry.addContract(versioningStorageKey, VersioningStorage.address)
    await deployer.deploy(VersioningFactory, Registry.address, versioningStorageKey, versionerAddress)
    await registry.addContract(versioningFactoryKey, VersioningFactory.address)

    await deployer.deploy(ServiceProviderStorage, Registry.address)
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address)

    const serviceProviderFactory = await deployer.deploy(
      ServiceProviderFactory,
      Registry.address,
      stakingProxyKey,
      delegateManagerKey,
      governanceKey,
      serviceProviderStorageKey, {
        gas: 20000000
      })

    await registry.addContract(serviceProviderFactoryKey, ServiceProviderFactory.address)
  })
}
