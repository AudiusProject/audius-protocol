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
const serviceTypeCN = web3.utils.utf8ToHex('creator-node')
// Creator node 
// Minimum: 200,000
// Maximum: 3,000,000
const cnTypeMin = _lib.audToWei(200000)
const cnTypeMax = _lib.audToWei(3000000)
// Discovery provider
// Minimum: 200,000
// Maximum: 2,000,000
const serviceTypeDP = web3.utils.utf8ToHex('discovery-provider')
const dpTypeMin = _lib.audToWei(200000)
const dpTypeMax = _lib.audToWei(2000000)


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
      proxyAdminAddress,
      serviceTypeCalldata,
      process.env.governanceAddress,
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
    const serviceTypeCNStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(serviceTypeCN)
    const [cnTypeMinV, cnTypeMaxV] = [serviceTypeCNStakeInfo[0], serviceTypeCNStakeInfo[1]]
    assert.ok(_lib.toBN(cnTypeMin).eq(cnTypeMinV), 'Expected same minStake')
    assert.ok(_lib.toBN(cnTypeMax).eq(cnTypeMaxV), 'Expected same max Stake')

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
    const serviceTypeDPStakeInfo = await serviceTypeManager.getServiceTypeStakeInfo.call(serviceTypeDP)
    const [dpTypeMinV, dpTypeMaxV] = [serviceTypeDPStakeInfo[0], serviceTypeDPStakeInfo[1]]
    assert.ok(_lib.toBN(dpTypeMin).eq(dpTypeMinV), 'Expected same minStake')
    assert.ok(_lib.toBN(dpTypeMax).eq(dpTypeMaxV), 'Expected same maxStake')

    // Deploy ServiceProviderFactory logic and proxy contracts + register proxy
    const serviceProviderFactory0 = await deployer.deploy(ServiceProviderFactory, { from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address'],
      [process.env.governanceAddress]
    )
    const serviceProviderFactoryProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      process.env.governanceAddress,
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
  })
}
