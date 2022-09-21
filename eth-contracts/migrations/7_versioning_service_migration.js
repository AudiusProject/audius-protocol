const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

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
const serviceTypeCN = web3.utils.utf8ToHex('content-node')
// Creator node 
// Minimum: 200,000
// Maximum: 3,000,000
const cnTypeMin = _lib.audToWei(200000)
const cnTypeMax = _lib.audToWei(3000000)
// Discovery provider
// Minimum: 200,000
// Maximum: 2,000,000
const serviceTypeDP = web3.utils.utf8ToHex('discovery-node')
const dpTypeMin = _lib.audToWei(200000)
const dpTypeMax = _lib.audToWei(2000000)
// stake lockup duration = 1 wk in blocks
// - 1/13 block/s * 604800 s/wk ~= 46523 block/wk
const decreaseStakeLockupDuration = 46523

// modifying deployer cut = 8 days in blocks
// - 1/13 block/s * 691200 s/8 days ~= 53169 block/wk
const deployerCutLockupDuration = 53169

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const registryAddress = process.env.registryAddress
    const claimsManagerAddress = process.env.claimsManagerAddress
    const governanceAddress = process.env.governanceAddress

    const claimsManager = await ClaimsManager.at(process.env.claimsManagerAddress)
    const registry = await Registry.at(registryAddress)
    const governance = await Governance.at(governanceAddress)

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
      process.env.governanceAddress,
      serviceTypeCalldata,
      { from: proxyDeployerAddress }
    )
    const serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    await _lib.registerContract(governance, serviceTypeManagerProxyKey, serviceTypeManager.address, guardianAddress)

    /* Register creatorNode and discoveryProvider service types via governance */

    const callValue0 = _lib.toBN(0)
    const signatureAddServiceType = 'addServiceType(bytes32,uint256,uint256)'

    const callDataCN = _lib.abiEncode(
      ['bytes32', 'uint256', 'uint256'],
      [serviceTypeCN, cnTypeMin, cnTypeMax]
    )
    await governance.guardianExecuteTransaction(
      serviceTypeManagerProxyKey,
      callValue0,
      signatureAddServiceType,
      callDataCN,
      { from: guardianAddress }
    )
    const serviceTypeCNInfo = await serviceTypeManager.getServiceTypeInfo.call(serviceTypeCN)
    assert.ok(_lib.toBN(cnTypeMin).eq(serviceTypeCNInfo.minStake), 'Expected same minStake')
    assert.ok(_lib.toBN(cnTypeMax).eq(serviceTypeCNInfo.maxStake), 'Expected same max Stake')

    const callDataDP = _lib.abiEncode(
      ['bytes32', 'uint256', 'uint256'],
      [serviceTypeDP, dpTypeMin, dpTypeMax]
    )
    await governance.guardianExecuteTransaction(
      serviceTypeManagerProxyKey,
      callValue0,
      signatureAddServiceType,
      callDataDP,
      { from: guardianAddress }
    )
    const serviceTypeDPInfo = await serviceTypeManager.getServiceTypeInfo.call(serviceTypeDP)
    assert.ok(_lib.toBN(dpTypeMin).eq(serviceTypeDPInfo.minStake), 'Expected same minStake')
    assert.ok(_lib.toBN(dpTypeMax).eq(serviceTypeDPInfo.maxStake), 'Expected same maxStake')

    // Deploy ServiceProviderFactory logic and proxy contracts + register proxy
    const serviceProviderFactory0 = await deployer.deploy(ServiceProviderFactory, { from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256', 'uint256'],
      [
        process.env.governanceAddress,
        process.env.claimsManagerAddress,
        decreaseStakeLockupDuration,
        deployerCutLockupDuration
      ]
    )
    const serviceProviderFactoryProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceProviderFactory0.address,
      process.env.governanceAddress,
      serviceProviderFactoryCalldata,
      { from: proxyDeployerAddress }
    )
    await _lib.registerContract(governance, serviceProviderFactoryKey, serviceProviderFactoryProxy.address, guardianAddress)

    // Set environment variable
    process.env.serviceProviderFactoryAddress = serviceProviderFactoryProxy.address

    const serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    // Set environment variable
    process.env.serviceProviderFactoryAddress = serviceProviderFactory.address


    // Set service provider factory in Staking.sol through governance
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress }
    )

    console.log(`ServiceProviderFactoryProxy Address: ${serviceProviderFactoryProxy.address}`)
    const staking = await Staking.at(process.env.stakingAddress)
    let spFactoryAddressFromStaking = await staking.getServiceProviderFactoryAddress()
    console.log(`ServiceProviderFactoryProxy Address from Staking.sol: ${spFactoryAddressFromStaking}`)

    // Set Staking address in ServiceProviderFactory.sol through governance
    await governance.guardianExecuteTransaction(
      serviceProviderFactoryKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [process.env.stakingAddress]),
      { from: guardianAddress })
    console.log(`Staking Address: ${staking.address}`)
    let stakingAddressFromSPFactory = await serviceProviderFactory.getStakingAddress()
    console.log(`Staking Address from ServiceProviderFactory.sol: ${stakingAddressFromSPFactory}`)

    // Set ServiceTypeManager address in ServiceProviderFactory.sol through governance
    await governance.guardianExecuteTransaction(
      serviceProviderFactoryKey,
      _lib.toBN(0),
      'setServiceTypeManagerAddress(address)',
      _lib.abiEncode(['address'], [serviceTypeManager.address]),
      { from: guardianAddress })
    console.log(`ServiceTypeManager Address: ${serviceTypeManager.address}`)
    let serviceManagerAddressFromSPFactory = await serviceProviderFactory.getServiceTypeManagerAddress()
    console.log(`ServiceTypeManager Address from ServiceProviderFactory.sol: ${serviceManagerAddressFromSPFactory}`)

    // Set ClaimsManager address in ServiceProviderFactory.sol through governance
    await governance.guardianExecuteTransaction(
      serviceProviderFactoryKey,
      _lib.toBN(0),
      'setClaimsManagerAddress(address)',
      _lib.abiEncode(['address'], [process.env.claimsManagerAddress]),
      { from: guardianAddress })
    
    let claimsManagerAddressFromSPFactory = await serviceProviderFactory.getClaimsManagerAddress()
    console.log(`ClaimsManager Address from ServiceProviderFactory.sol: ${claimsManagerAddressFromSPFactory}`);
    // TODO - add DelegateManager
    
    // Set service provider address in ClaimsManager.sol through governance
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress }
    )
    assert.strict.equal(
      serviceProviderFactoryProxy.address,
      await claimsManager.getServiceProviderFactoryAddress(),
      'Expect updated claims manager'
    )
    // Set ServiceProviderFactory address in Governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress }
    )
    assert.equal(await governance.getServiceProviderFactoryAddress.call(), serviceProviderFactoryProxy.address)
  })
}
