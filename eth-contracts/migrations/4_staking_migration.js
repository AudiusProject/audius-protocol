const contractConfig = require('../contract-config.js')

const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
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
    const registry = await Registry.deployed()
    const token = await AudiusToken.deployed()

    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]

    const staking0 = await deployer.deploy(Staking, { from: proxyDeployerAddress })

    // Encode data for the call to initialize
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
      { from: accounts[0] }
    )
  })
}
