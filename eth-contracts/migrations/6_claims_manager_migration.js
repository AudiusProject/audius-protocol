const contractConfig = require('../contract-config.js')
const { encodeCall } = require('../utils/lib')
const _lib = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const ClaimsManager = artifacts.require('ClaimsManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Governance = artifacts.require('Governance')

const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
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

    // Deploy ClaimsManager logic and proxy contracts + register proxy
    const claimsManager0 = await deployer.deploy(ClaimsManager, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address',  'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [tokenAddress, registryAddress, stakingProxyKey, serviceProviderFactoryKey, delegateManagerKey, governanceKey]
    )
    const claimsManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      claimsManager0.address,
      proxyAdminAddress,
      initializeCallData,
      registryAddress,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(claimsManagerProxyKey, claimsManagerProxy.address, { from: proxyDeployerAddress })

    // Register ClaimsManager as minter
    // Note that by default this is called from proxyDeployerAddress in ganache
    // During an actual migration, this step should be run independently
    await token.addMinter(claimsManagerProxy.address, { from: proxyDeployerAddress })

    const guardianAddress = proxyDeployerAddress

    // Set claims manager addreess in Staking.sol through governance
    const governance = await Governance.at(process.env.governanceAddress)
    const setStakingAddressTxReceeipt = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'setClaimsManagerAddress(address)',
      _lib.abiEncode(['address'], [claimsManagerProxy.address]),
      { from: guardianAddress })
  })
}
