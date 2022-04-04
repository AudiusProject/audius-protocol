/**
 * proxy upgrade for DelegateManager to DelegateManagerV2
 * uses governance guardian override
 * NOTE this is for local dev only, real deploy will require full governance proposal process
 */

const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const DelegateManagerV2 = artifacts.require('DelegateManagerV2')
const Governance = artifacts.require('Governance')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const governanceAddress = process.env.governanceAddress
    const governance = await Governance.at(governanceAddress)
    const delegateManagerV2Logic = await DelegateManagerV2.new({ from: proxyAdminAddress })

    /**
     * Submit contract proxy upgrade via governance guardian
     */
    const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
    const callValue0 = _lib.toBN(0)
    const functionSignature = 'upgradeTo(address)'
    const callData = _lib.abiEncode(['address'], [delegateManagerV2Logic.address])
    await governance.guardianExecuteTransaction(
      delegateManagerKey,
      callValue0,
      functionSignature,
      callData,
      { from: guardianAddress }
    )

    /**
     * Confirm proxy is re-pointed to new logic contract
     */
    const delegateManagerAddress = process.env.delegateManagerAddress
    const delegateManagerProxy = await AudiusAdminUpgradeabilityProxy.at(delegateManagerAddress)
    assert.strictEqual(
      await delegateManagerProxy.implementation.call({ from: proxyAdminAddress }),
      delegateManagerV2Logic.address
    )
  })
}