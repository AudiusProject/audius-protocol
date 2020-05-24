const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const assert = require('assert')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const DelegateManager = artifacts.require('DelegateManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const ClaimsManager = artifacts.require('ClaimsManager')

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
    const stakingAddress = process.env.stakingAddress
    const governanceAddress = process.env.governanceAddress
    const claimsManagerAddress = process.env.claimsManagerAddress
    const serviceProviderFactoryAddress = process.env.serviceProviderFactoryAddress

    const token = await AudiusToken.at(tokenAddress)
    const registry = await Registry.at(registryAddress)

    // Deploy DelegateManager logic and proxy contracts + register proxy
    const delegateManager0 = await deployer.deploy(DelegateManager, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governanceAddress]
    )
    const delegateManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      delegateManager0.address,
      proxyAdminAddress,
      initializeCallData,
      governanceAddress,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: proxyDeployerAddress })
    const delegateManager = await DelegateManager.at(delegateManagerProxy.address)

    // Set delegate manager address in Staking.sol through governance
    const governance = await Governance.at(process.env.governanceAddress)
    const setDelManagerAddressTxReceipt = await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
    console.log(`DelegateManagerProxy Address: ${delegateManagerProxy.address}`)
    const staking = await Staking.at(stakingAddress)
    let delManAddrFromStaking = await staking.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from Staking.sol: ${delManAddrFromStaking}`)
    assert.strict.equal(delegateManager.address, delManAddrFromStaking, 'Failed to set staking address')

    // Set delegate manager address in ClaimsManager.sol through governance
    const claimsManager = await ClaimsManager.at(claimsManagerAddress)
    const setDelManagerInClaimsManagerTx = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [claimsManagerAddress]),
      { from: guardianAddress })

    // Configure addresses in DelegateManager.sol through governance
    const setStakingAddressInDelegateManagerReceipt = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [stakingAddress]),
      { from: guardianAddress }
    )
    assert.strict.equal(stakingAddress, await delegateManager.getStakingAddress(), 'Failed to set staking address')

    const setSPFactoryAddr = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryAddress]),
      { from: guardianAddress }
    )
    assert.strict.equal(
      serviceProviderFactoryAddress,
      await delegateManager.getServiceProviderFactoryAddress(),
      'Failed to set sp address'
    )
    const spClaimsManagerAddress = await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'setClaimsManagerAddress(address)',
      _lib.abiEncode(['address'], [claimsManagerAddress]),
      { from: guardianAddress }
    )
    assert.strict.equal(
      claimsManagerAddress,
      await delegateManager.getClaimsManagerAddress(),
      'Failed to set claims address'
    )
  })
}
