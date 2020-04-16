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
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')


module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const registry = await Registry.deployed()

    const versionerAddress = config.versionerAddress || accounts[0]
    const treasuryAddress = config.treasuryAddress || accounts[0]

    await deployer.deploy(VersioningStorage, Registry.address, { from: treasuryAddress })
    await registry.addContract(versioningStorageKey, VersioningStorage.address, { from: treasuryAddress })
    await deployer.deploy(VersioningFactory, Registry.address, versioningStorageKey, versionerAddress, { from: treasuryAddress })
    await registry.addContract(versioningFactoryKey, VersioningFactory.address, { from: treasuryAddress })

    await deployer.deploy(ServiceProviderStorage, Registry.address, { from: treasuryAddress })
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address, { from: treasuryAddress })

    const serviceProviderFactory = await deployer.deploy(
      ServiceProviderFactory,
      Registry.address,
      stakingProxyKey,
      serviceProviderStorageKey,
      { from: treasuryAddress }
    )

    await registry.addContract(serviceProviderFactoryKey, ServiceProviderFactory.address, { from: treasuryAddress })

    const stakingProxyAddress = await registry.getContract.call(stakingProxyKey)

    // Set owner of staking contract to ServiceProviderFactory
    const staking = await Staking.at(stakingProxyAddress)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address, { from: treasuryAddress })
  })
}
