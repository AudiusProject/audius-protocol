/**
 * proxy upgrade for Governance to GovernanceV2
 * uses governance guardian override
 *
 * @notice this is for local dev only, real deploy will require full governance proposal process
 */

const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Governance = artifacts.require('Governance')
const GovernanceV2 = artifacts.require('GovernanceV2')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const governanceProxyAddress = process.env.governanceAddress
    const governance = await Governance.at(governanceProxyAddress)
    
    // Deploy GovernanceV2 logic contract
    const governanceV2Logic = await GovernanceV2.new({ from: proxyDeployerAddress })

    // Submit contract proxy upgrade via governance guardian
    const governanceKey = web3.utils.utf8ToHex('Governance')
    const callValue0 = _lib.toBN(0)
    const functionSignature = 'upgradeTo(address)'
    const callData = _lib.abiEncode(['address'], [governanceV2Logic.address])
    await governance.guardianExecuteTransaction(
      governanceKey,
      callValue0,
      functionSignature,
      callData,
      { from: guardianAddress }
    )

    // Confirm proxy is re-pointed to new logic contract
     const governanceProxy = await AudiusAdminUpgradeabilityProxy.at(governanceProxyAddress)
     assert.strictEqual(
       await governanceProxy.implementation.call({ from: proxyAdminAddress }),
       governanceV2Logic.address
     )
  })
}