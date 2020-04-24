const encodeCall = require('../utils/encodeCall')
const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const DelegateManager = artifacts.require('DelegateManager')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const token = await AudiusToken.deployed()
    const registry = await Registry.deployed()

    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]

    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, governanceKey, stakingProxyKey, serviceProviderFactoryKey, claimsManagerProxyKey]
    )

    // Deploy DelegateManager logic contract
    const delegateManager0 = await deployer.deploy(DelegateManager, { from: proxyDeployerAddress })

    // Deploy new ClaimsManager
    const delegateManagerProxy = await deployer.deploy(
      AdminUpgradeabilityProxy,
      delegateManager0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: accounts[0] })
  })
}
