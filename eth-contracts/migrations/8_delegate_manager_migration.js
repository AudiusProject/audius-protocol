const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const DelegateManager = artifacts.require('DelegateManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')

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
    const governanceAddress = process.env.governanceAddress

    const token = await AudiusToken.at(tokenAddress)
    const registry = await Registry.at(registryAddress)
    const governance = await Governance.at(governanceAddress)

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
    await _lib.registerContract(governance, delegateManagerKey, delegateManagerProxy.address, guardianAddress)

    // Set delegate manager address in Staking.sol through governance
    const setDelManagerAddressTxReceipt = await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress }
    )
    assert.equal(_lib.parseTx(setDelManagerAddressTxReceipt).event.args.success, true)
    
    console.log(`DelegateManagerProxy Address: ${delegateManagerProxy.address}`)
    const staking = await Staking.at(process.env.stakingAddress)
    let delManAddrFromStaking = await staking.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from Staking.sol: ${delManAddrFromStaking}`)
  })
}
