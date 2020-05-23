const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const assert = require('assert').strict

const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Governance = artifacts.require('Governance')
const ClaimsManager = artifacts.require('ClaimsManager')

const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')

// Known service types
const serviceTypeCN = web3.utils.utf8ToHex('creator-node')
const cnTypeMin = _lib.audToWei(10)
const cnTypeMax = _lib.audToWei(10000000)
const serviceTypeDP = web3.utils.utf8ToHex('discovery-provider')
const dpTypeMin = _lib.audToWei(5)
const dpTypeMax = _lib.audToWei(10000000)


module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const registryAddress = process.env.registryAddress
    const claimsManagerAddress = process.env.claimsManagerAddress
    const registry = await Registry.at(registryAddress)

    // Deploy ServiceTypeManager logic and proxy contracts + register proxy
    const serviceTypeManager0 = await deployer.deploy(ServiceTypeManager, { from: proxyDeployerAddress })
    const serviceTypeCalldata = _lib.encodeCall(
      'initialize',
      ['address'],
      [process.env.governanceAddress]
    )
    const serviceTypeManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeCalldata,
      process.env.governanceAddress,
      { from: proxyDeployerAddress }
    )
    const serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await registry.addContract(
      serviceTypeManagerProxyKey,
      serviceTypeManager.address,
      { from: proxyDeployerAddress }
    )

    // Register creatorNode and discoveryProvider service types via governance

    const governance = await Governance.at(process.env.governanceAddress)
    const callValue0 = _lib.toBN(0)
    const signatureAddServiceType = 'addServiceType(bytes32,uint256,uint256)'

    const callDataCN = _lib.abiEncode(
      ['bytes32', 'uint256', 'uint256'],
      [serviceTypeCN, cnTypeMin, cnTypeMax]
    )
    const addServiceTypeCNTxReceipt = await governance.guardianExecuteTransaction(
      serviceTypeManagerProxyKey,
      callValue0,
      signatureAddServiceType,
      callDataCN,
      { from: guardianAddress }
    )
    assert.equal(_lib.parseTx(addServiceTypeCNTxReceipt).event.args.success, true, 'event.args.success')
    const serviceTypeCNStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(serviceTypeCN)
    const [cnTypeMinV, cnTypeMaxV] = [serviceTypeCNStakeInfo[0], serviceTypeCNStakeInfo[1]]
    assert.ok(_lib.toBN(cnTypeMin).eq(cnTypeMinV), 'Expected same minStake')
    assert.ok(_lib.toBN(cnTypeMax).eq(cnTypeMaxV), 'Expected same max Stake')

    const callDataDP = _lib.abiEncode(
      ['bytes32', 'uint256', 'uint256'],
      [serviceTypeDP, dpTypeMin, dpTypeMax]
    )
    const addServiceTypeDPTxReceipt = await governance.guardianExecuteTransaction(
      serviceTypeManagerProxyKey,
      callValue0,
      signatureAddServiceType,
      callDataDP,
      { from: guardianAddress }
    )
    assert.equal(_lib.parseTx(addServiceTypeDPTxReceipt).event.args.success, true, 'event.args.success')
    const serviceTypeDPStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(serviceTypeDP)
    const [dpTypeMinV, dpTypeMaxV] = [serviceTypeDPStakeInfo[0], serviceTypeDPStakeInfo[1]]
    assert.ok(_lib.toBN(dpTypeMin).eq(dpTypeMinV), 'Expected same minStake')
    assert.ok(_lib.toBN(dpTypeMax).eq(dpTypeMaxV), 'Expected same maxStake')

    // Deploy ServiceProviderFactory logic and proxy contracts + register proxy
    const serviceProviderFactory0 = await deployer.deploy(ServiceProviderFactory, { from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [registryAddress, stakingProxyKey, delegateManagerKey, governanceKey, serviceTypeManagerProxyKey, claimsManagerProxyKey]
    )
    const serviceProviderFactoryProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      process.env.governanceAddress,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(
      serviceProviderFactoryKey,
      serviceProviderFactoryProxy.address,
      { from: proxyDeployerAddress }
    )

    // Set service provider factory in Staking.sol through governance
    const setSPFactoryStakingTxReceipt = await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress })
    console.log(`ServiceProviderFactoryProxy Address: ${serviceProviderFactoryProxy.address}`)
    const staking = await Staking.at(process.env.stakingAddress)
    let spFactoryAddressFromStaking = await staking.getServiceProviderFactoryAddress()
    console.log(`ServiceProviderFactoryProxy Address from Staking.sol: ${spFactoryAddressFromStaking}`)

    // Set service provider address in ClaimsManager.sol through governance
    const setSPFactoryClaimsManagerTxReceipt = await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress }
    )
    const claimsManager = await ClaimsManager.at(claimsManagerAddress)
    assert.strict.equal(
      serviceProviderFactoryProxy.address,
      await claimsManager.getServiceProviderFactoryAddress(),
      'Expect updated claims manager'
    )
  })
}
