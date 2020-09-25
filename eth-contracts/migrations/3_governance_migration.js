const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceRegKey = web3.utils.utf8ToHex('Governance')

// 48hr * 60 min/hr * 60 sec/min / ~13 sec/block = 13292 blocks
const VotingPeriod = 13292
// Required percent of total stake to have been voted with on proposal
const VotingQuorumPercent = 10

// Max number of concurrent InProgress proposals
// - Setting to 100 by default as that is a sufficiently large value that is not at gas limit risk
const MaxInProgressProposals = 100

// 24hr * 60min/hr * 60sec/min / ~13 sec/block = 6646 blocks
const ExecutionDelayBlocks = 6646

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const registryAddress = process.env.registryAddress
    const registry = await Registry.at(registryAddress)
    const registryProxy = await AudiusAdminUpgradeabilityProxy.at(registryAddress)

    // Deploy + register Governance
    const governance0 = await deployer.deploy(Governance, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      [
        'address',
        'uint256',
        'uint256',
        'uint256',
        'uint16',
        'address'
      ],
      [
        registryAddress,
        VotingPeriod,
        ExecutionDelayBlocks,
        VotingQuorumPercent,
        MaxInProgressProposals,
        guardianAddress
      ]
    )
    const governanceProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      governance0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )
    const governance = await Governance.at(governanceProxy.address)

    // Set governance Address on Governance proxy contract to enable self-upgradeability
    let govAddrFromProxy = await governanceProxy.getAudiusProxyAdminAddress.call()
    assert.strictEqual(govAddrFromProxy, proxyAdminAddress)
    await governanceProxy.setAudiusProxyAdminAddress(governanceProxy.address, { from: proxyAdminAddress })
    govAddrFromProxy = await governanceProxy.getAudiusProxyAdminAddress.call()
    assert.strictEqual(govAddrFromProxy, governanceProxy.address)

    // Set governance address on Registry proxy contract to enable upgrades
    await registryProxy.setAudiusProxyAdminAddress(governanceProxy.address, { from: proxyAdminAddress })
    let govAddrFromRegProxy = await registryProxy.getAudiusProxyAdminAddress()
    assert.strictEqual(govAddrFromRegProxy, governanceProxy.address)

    // Transfer registry ownership to Governance
    await registry.transferOwnership(governance.address, { from: proxyDeployerAddress })
    assert.strictEqual(await registry.owner.call(), governance.address)

    // Register contract via governance
    await _lib.registerContract(governance, governanceRegKey, governance.address, guardianAddress)

    // Export to env for reference in future migrations
    process.env.governanceAddress = governance.address
  })
}
