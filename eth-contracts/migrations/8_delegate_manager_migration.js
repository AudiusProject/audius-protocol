const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const DelegateManager = artifacts.require('DelegateManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const tokenAddress = process.env.tokenAddress
    const registryAddress = process.env.registryAddress

    const token = await AudiusToken.at(tokenAddress)
    const registry = await Registry.at(registryAddress)

    // Deploy DelegateManager logic and proxy contracts + register proxy
    const delegateManager0 = await deployer.deploy(DelegateManager, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, governanceKey, stakingProxyKey, serviceProviderFactoryKey, claimsManagerProxyKey]
    )
    const delegateManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      delegateManager0.address,
      proxyAdminAddress,
      initializeCallData,
      process.env.governanceAddress,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: proxyDeployerAddress })

    // Set delegate manager address in Staking.sol through governance
    const governance = await Governance.at(process.env.governanceAddress)
    const setDelManagerAddressTxReceipt = await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
    console.log(`DelegateManagerProxy Address: ${delegateManagerProxy.address}`)
    const staking = await Staking.at(process.env.stakingAddress)
    let delManAddrFromStaking = await staking.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from Staking.sol: ${delManAddrFromStaking}`)

    // Set delegate manager address in ServiceProviderFactory.sol through governance
    const setDelManagerAddressInSPFactoryTxReceipt = await governance.guardianExecuteTransaction(
      serviceProviderFactoryKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
    const SPFactory = await ServiceProviderFactory.at(process.env.serviceProviderFactoryAddress)
    let delManAddrFromSPFactory = await SPFactory.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from ServiceProviderFactory.sol: ${delManAddrFromSPFactory}`)
  })
}
