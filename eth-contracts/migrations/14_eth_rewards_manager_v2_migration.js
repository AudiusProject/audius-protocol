/**
 * proxy upgrade for EthRewardsManager to EthRewardsManagerV2
 * uses governance guardian override
 * NOTE this is for local dev only, real deploy will require full governance proposal process
 */

const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib.js')

const AudiusAdminUpgradeabilityProxy = artifacts.require(
  'AudiusAdminUpgradeabilityProxy'
)
const EthRewardsManagerV2 = artifacts.require('EthRewardsManagerV2')
const Governance = artifacts.require('Governance')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const governanceAddress = process.env.governanceAddress
    const governance = await Governance.at(governanceAddress)
    const ethRewardsManagerV2Logic = await EthRewardsManagerV2.new({
      from: proxyDeployerAddress
    })

    const ethRewardsManagerAddress = process.env.ethRewardsManagerAddress
    const ethRewardsManagerProxy = await AudiusAdminUpgradeabilityProxy.at(
      ethRewardsManagerAddress
    )
    /**
     * Confirm old implementation is not the new implementation
     */
    const oldImplementation = await ethRewardsManagerProxy.implementation.call({
      from: proxyAdminAddress
    })
    assert.notStrictEqual(oldImplementation, ethRewardsManagerV2Logic.address)

    /**
     * Submit contract proxy upgrade via governance guardian
     */
    const ethRewardsManagerKey = web3.utils.utf8ToHex('EthRewardsManagerProxy')
    const callValue0 = _lib.toBN(0)
    const functionSignature = 'upgradeTo(address)'
    const callData = _lib.abiEncode(
      ['address'],
      [ethRewardsManagerV2Logic.address]
    )
    await governance.guardianExecuteTransaction(
      ethRewardsManagerKey,
      callValue0,
      functionSignature,
      callData,
      { from: guardianAddress }
    )

    /**
     * Confirm proxy is re-pointed to new logic contract
     */
    assert.strictEqual(
      await ethRewardsManagerProxy.implementation.call({
        from: proxyAdminAddress
      }),
      ethRewardsManagerV2Logic.address
    )
  })
}
