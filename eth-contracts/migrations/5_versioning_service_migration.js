const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
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
    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]

    const serviceTypeManager0 = await deployer.deploy(ServiceTypeManager, { from: proxyDeployerAddress })

    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32'],
      [registry.address, versionerAddress, governanceKey]
    )

    const serviceTypeManagerProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      serviceTypeManager0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address)

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
      serviceTypeManagerProxyKey,
      serviceProviderStorageKey
    )
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactory.address)
  })
}
