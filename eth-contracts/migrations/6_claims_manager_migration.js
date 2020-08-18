const assert = require('assert')
const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')
const Registry = artifacts.require('Registry')
const ClaimsManager = artifacts.require('ClaimsManager')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Governance = artifacts.require('Governance')
const Staking = artifacts.require('Staking')

const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const tokenRegKey = web3.utils.utf8ToHex('Token')

const callValue0 = _lib.toBN(0)

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const tokenAddress = process.env.tokenAddress
    const registryAddress = process.env.registryAddress
    const governanceAddress = process.env.governanceAddress
    const stakingAddress = process.env.stakingAddress

    const registry = await Registry.at(registryAddress)
    const governance = await Governance.at(governanceAddress)

    // Deploy ClaimsManager logic and proxy contracts + register proxy
    const claimsManager0 = await deployer.deploy(ClaimsManager, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenAddress, process.env.governanceAddress]
    )
    const claimsManagerProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      claimsManager0.address,
      governanceAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    const claimsManager = await ClaimsManager.at(claimsManagerProxy.address)
    _lib.registerContract(governance, claimsManagerProxyKey, claimsManagerProxy.address, guardianAddress)

    // Set environment variable
    process.env.claimsManagerAddress = claimsManagerProxy.address

    // Register ClaimsManager as minter
    // Note that by default this is called from proxyDeployerAddress in ganache
    // During an actual migration, this step should be run independently
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [claimsManagerProxy.address]),
      { from: guardianAddress }
    )

    // Set claims manager address in Staking.sol through governance
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      callValue0,
      'setClaimsManagerAddress(address)',
      _lib.abiEncode(['address'], [claimsManagerProxy.address]),
      { from: guardianAddress }
    )

    console.log(`ClaimsManagerProxy Address: ${claimsManagerProxy.address}`)
    const staking = await Staking.at(stakingAddress)
    let claimsManagerAddressFromStaking = await staking.getClaimsManagerAddress()
    console.log(`ClaimsManagerProxy Address from Staking.sol: ${claimsManagerAddressFromStaking}`)

    // Set staking address in ClaimsManager.sol through governance
    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [stakingAddress]),
      { from: guardianAddress }
    )
    const stakingAddressFromClaimsManager = await claimsManager.getStakingAddress()
    assert.strict.equal(stakingAddress, stakingAddressFromClaimsManager, 'Failed to set staking address')
  })
}
