const contractConfig = require('../contract-config.js')
const { encodeCall } = require('../utils/lib')
const _lib = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Registry = artifacts.require('Registry')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

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

    // Deploy Staking logic and proxy contracts + register proxy
    const staking0 = await deployer.deploy(Staking, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, process.env.governanceAddress]
    )
    const stakingProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      staking0.address,
      proxyAdminAddress,
      initializeCallData,
      process.env.governanceAddress,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(
      stakingProxyKey,
      stakingProxy.address,
      { from: proxyDeployerAddress }
    )

    process.env.stakingAddress = stakingProxy.address

    // Set stakingAddress in Governance
    const governance = await Governance.at(process.env.governanceAddress)
    const callValue0 = _lib.toBN(0)
    console.log(`StakingAddress ${stakingProxy.address}`)
    const callDataSetStakingAddr = _lib.abiEncode(['address'], [stakingProxy.address])
    const setStakingAddressTxReceeipt = await governance.guardianExecuteTransaction(
      governanceKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      callDataSetStakingAddr,
      { from: guardianAddress })
    let stakingFromGov = await governance.getStakingAddress()
    console.log(`StakingAddressFromGov ${stakingFromGov}`)
  })
}
