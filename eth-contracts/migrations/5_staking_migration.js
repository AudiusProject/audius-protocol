const contractConfig = require('../contract-config.js')
const { encodeCall } = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    const tokenAddress = process.env.tokenAddress
    const registryAddress = process.env.registryAddress

    const token = await AudiusToken.at(tokenAddress)
    const registry = await Registry.at(registryAddress)

    // Deploy Staking logic and proxy contracts + register proxy
    const staking0 = await deployer.deploy(Staking, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall(
      'initialize',
      [
        'address',
        'address',
        'bytes32',
        'bytes32',
        'bytes32'
      ],
      [
        token.address,
        registry.address,
        claimsManagerProxyKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ])
    const stakingProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      staking0.address,
      proxyAdminAddress,
      initializeCallData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(
      stakingProxyKey,
      stakingProxy.address,
      { from: proxyDeployerAddress }
    )

    // Set stakingAddress in Governance
  })
}
