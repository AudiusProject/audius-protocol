const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const ClaimsManager = artifacts.require('ClaimsManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const token = await AudiusToken.deployed()
    const registry = await Registry.deployed()
    const registryAddress = registry.address
    const tokenDeployerAcct = accounts[0]
    const controllerAddress = config.controllerAddress || accounts[0]

    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]

    const claimsManager0 = await deployer.deploy(ClaimsManager, { from: proxyDeployerAddress })

    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registryAddress, controllerAddress, stakingProxyKey, serviceProviderFactoryKey, delegateManagerKey]
    )

    // Deploy new ClaimsManager
    const claimsManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      claimsManager0.address,
      proxyAdminAddress,
      initializeCallData,
      registryAddress,
      governanceKey,
      { from: proxyDeployerAddress }
    )

    // Register ClaimsManager
    await registry.addContract(claimsManagerProxyKey, claimsManagerProxy.address, { from: accounts[0] })

    // Register ClaimsManager as minter
    // Note that by default this is called from accounts[0] in ganache
    // During an actual migration, this step should be run independently
    await token.addMinter(claimsManagerProxy.address, { from: tokenDeployerAcct })
  })
}
