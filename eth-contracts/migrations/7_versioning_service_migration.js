const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

// Known service types
const discoveryProvider = web3.utils.utf8ToHex('discovery-provider')
const creatorNode = web3.utils.utf8ToHex('creator-node')

const audToWeiBN = (aud) => {
  const amountInAudWei = web3.utils.toWei(aud.toString(), 'ether')
  return web3.utils.toBN(amountInAudWei)
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const controllerAddress = config.controllerAddress || accounts[0]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    const registryAddress = process.env.registryAddress
    const registry = await Registry.at(registryAddress)

    // Deploy ServiceTypeManager logic and proxy contracts + register proxy
    const serviceTypeManager0 = await deployer.deploy(ServiceTypeManager, { from: proxyDeployerAddress })
    const serviceTypeCalldata = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32'],
      [registryAddress, controllerAddress, governanceKey]
    )
    const serviceTypeManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeCalldata,
      registryAddress,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(
      serviceTypeManagerProxyKey,
      serviceTypeManagerProxy.address,
      { from: proxyDeployerAddress }
    )

    // Register creatorNode and discoveryProvider service types
    const serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await serviceTypeManager.addServiceType(
      creatorNode,
      audToWeiBN(10),
      audToWeiBN(10000000),
      { from: controllerAddress })
    await serviceTypeManager.addServiceType(
      discoveryProvider,
      audToWeiBN(5),
      audToWeiBN(10000000),
      { from: controllerAddress })

    // Deploy ServiceProviderFactory logic and proxy contracts + register proxy
    const serviceProviderFactory0 = await deployer.deploy(ServiceProviderFactory, { from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = encodeCall(
      'initialize',
      ['address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [registryAddress, stakingProxyKey, delegateManagerKey, governanceKey, serviceTypeManagerProxyKey]
    )
    const serviceProviderFactoryProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      registryAddress,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(
      serviceProviderFactoryKey,
      serviceProviderFactoryProxy.address,
      { from: proxyDeployerAddress }
    )
  })
}
