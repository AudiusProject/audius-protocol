const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const AudiusToken = artifacts.require('AudiusToken')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const tokenAddress = process.env.tokenAddress
    const governanceAddress = process.env.governanceAddress

    const token = await AudiusToken.at(tokenAddress)
    const governance = await Governance.at(governanceAddress)

    // Deploy Staking logic and proxy contracts + register proxy
    const staking0 = await deployer.deploy(Staking, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, process.env.governanceAddress]
    )
    const stakingProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      staking0.address,
      process.env.governanceAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )
    _lib.registerContract(governance, stakingProxyKey, stakingProxy.address, guardianAddress)

    // Set environment variable
    process.env.stakingAddress = stakingProxy.address

    // Set stakingAddress in Governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [stakingProxy.address]),
      { from: guardianAddress }
    )

    assert.equal(await governance.getStakingAddress.call(), stakingProxy.address)
  })
}
