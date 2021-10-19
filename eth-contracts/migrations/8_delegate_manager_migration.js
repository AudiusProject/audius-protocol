const assert = require('assert')
const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const DelegateManager = artifacts.require('DelegateManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ClaimsManager = artifacts.require('ClaimsManager')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

// undelegate lockup duration = 1 wk in blocks
// - 1/13 block/s * 604800 s/wk ~= 46523 block/wk
const undelegateLockupDuration = 46523

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
    const governance = await Governance.at(governanceAddress)

    // Deploy DelegateManager logic and proxy contracts + register proxy
    const delegateManager0 = await deployer.deploy(DelegateManager, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'uint256'],
      [token.address, governanceAddress, undelegateLockupDuration]
    )
    const delegateManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      delegateManager0.address,
      governanceAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    await _lib.registerContract(governance, delegateManagerKey, delegateManagerProxy.address, guardianAddress)
    const delegateManager = await DelegateManager.at(delegateManagerProxy.address)

    // Set environment variable
    process.env.delegateManagerAddress = delegateManagerProxy.address

    // Set delegate manager address in Staking.sol through governance
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress }
    )
    
    console.log(`DelegateManagerProxy Address: ${delegateManagerProxy.address}`)
    const staking = await Staking.at(stakingAddress)
    let delManAddrFromStaking = await staking.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from Staking.sol: ${delManAddrFromStaking}`)

    // Set delegate manager address in ServiceProviderFactory.sol through governance
    await governance.guardianExecuteTransaction(
      serviceProviderFactoryKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
    const SPFactory = await ServiceProviderFactory.at(process.env.serviceProviderFactoryAddress)
    let delManAddrFromSPFactory = await SPFactory.getDelegateManagerAddress()
    console.log(`DelegateManagerProxy Address from ServiceProviderFactory.sol: ${delManAddrFromSPFactory}`)
    assert.strict.equal(delegateManager.address, delManAddrFromStaking, 'Failed to set staking address')

    // Set delegate manager address in ClaimsManager.sol through governance
    const claimsManager = await ClaimsManager.at(claimsManagerAddress)
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
      const delManAddrFromClaimsManager = await claimsManager.getDelegateManagerAddress()
      console.log(`DelegateManagerProxy Address from ClaimsManager.sol: ${delManAddrFromSPFactory}`)
      assert.strict.equal(delegateManagerProxy.address, delManAddrFromClaimsManager, 'Failed to set delegate manager address in claims manager')

    // Configure addresses in DelegateManager.sol through governance
    await governance.guardianExecuteTransaction(
      delegateManagerKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [stakingAddress]),
      { from: guardianAddress }
    )
    assert.strict.equal(stakingAddress, await delegateManager.getStakingAddress(), 'Failed to set staking address')

    await governance.guardianExecuteTransaction(
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
    await governance.guardianExecuteTransaction(
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
    // Set DelegateManager address in Governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress }
    )
    assert.equal(await governance.getDelegateManagerAddress.call(), delegateManagerProxy.address)
  })
}
