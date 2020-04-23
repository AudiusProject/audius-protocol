const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')

const ServiceTypeManagerKey = web3.utils.utf8ToHex('ServiceTypeManager')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')


module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const registry = await Registry.deployed()

    const versionerAddress = config.versionerAddress || accounts[0]

    // Deploy + Register ServiceTypeManager contract
    await deployer.deploy(ServiceTypeManager, Registry.address, versionerAddress)
    await registry.addContract(ServiceTypeManagerKey, ServiceTypeManager.address)

    // Deploy + Register ServiceProviderStorage contract
    await deployer.deploy(ServiceProviderStorage, Registry.address)
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address)

    // Deploy + Register ServiceProviderFactory contract
    const serviceProviderFactory = await deployer.deploy(
      ServiceProviderFactory,
      Registry.address,
      stakingProxyKey,
      delegateManagerKey,
      governanceKey,
      serviceProviderStorageKey
    )
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address)
  })
}
