const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

// Known service types
const discoveryProvider = web3.utils.utf8ToHex('discovery-provider')
const creatorNode = web3.utils.utf8ToHex('creator-node')

const toWei = (aud) => {
  const amountInAudWei = web3.utils.toWei(aud.toString(), 'ether')
  return web3.utils.toBN(amountInAudWei)
}

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const registry = await Registry.deployed()

    const controllerAddress = config.controllerAddress || accounts[0]
    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]

    const serviceTypeManager0 = await deployer.deploy(ServiceTypeManager, { from: proxyDeployerAddress })
    const serviceTypeCalldata = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32'],
      [registry.address, controllerAddress, governanceKey]
    )

    const serviceTypeManagerProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeCalldata,
      { from: proxyDeployerAddress }
    )

    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address)
    let serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    // Register creator node
    await serviceTypeManager.addServiceType(
      creatorNode,
      toWei(10),
      toWei(10000000),
      { from: controllerAddress })
    // Register discovery provider
    await serviceTypeManager.addServiceType(
      discoveryProvider,
      toWei(5),
      toWei(10000000),
      { from: controllerAddress })

    // Deploy + Register ServiceProviderFactory contract
    const serviceProviderFactory0 = await deployer.deploy(ServiceProviderFactory, { from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = encodeCall(
      'initialize',
      ['address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [registry.address, stakingProxyKey, delegateManagerKey, governanceKey, serviceTypeManagerProxyKey]
    )

    const serviceProviderFactoryProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      { from: proxyDeployerAddress }
    )

    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address)
  })
}
