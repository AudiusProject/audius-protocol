const assert = require('assert')

const contractConfig = require('../contract-config.js')
const _lib = require('../utils/lib')

const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceRegKey = web3.utils.utf8ToHex('Governance')

// 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
const VotingPeriod = 11520
// Required percent of total stake to have been voted with on proposal
const VotingQuorumPercent = 10

// Max number of concurrent InProgress proposals
// - Setting to 100 by default as that is a sufficiently large value that is not at gas limit risk
const MaxInProgressProposals = 100

const MaxDescriptionLengthBytes = 250

// 5hr * 60min/hr * 60sec/min / ~15 sec/block = 1200 blocks
const ExecutionDelayBlocks = 1200

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]
    const guardianAddress = config.guardianAddress || proxyDeployerAddress

    const registryAddress = process.env.registryAddress
    const registry = await Registry.at(registryAddress)

    // Deploy + register Governance
    const governance0 = await deployer.deploy(Governance, { from: proxyDeployerAddress })
    const initializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'uint256', 'uint256', 'uint16', 'uint16', 'uint16', 'address'],
      [registryAddress, VotingPeriod, VotingQuorumPercent, MaxInProgressProposals, MaxDescriptionLengthBytes, ExecutionDelayBlocks, guardianAddress]
    )
    const governanceProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      governance0.address,
      proxyAdminAddress,
      initializeCallData,
      _lib.addressZero,
      { from: proxyDeployerAddress }
    )
    const governance = await Governance.at(governanceProxy.address)

    // Set governance Address on Governance proxy contract to enable self-upgradeability
    let govAddrFromProxy = await governanceProxy.getAudiusGovernanceAddress.call()
    assert.equal(govAddrFromProxy, _lib.addressZero)
    await governanceProxy.setAudiusGovernanceAddress(governanceProxy.address, { from: proxyAdminAddress })
    govAddrFromProxy = await governanceProxy.getAudiusGovernanceAddress.call()
    assert.equal(govAddrFromProxy, governanceProxy.address)

    // Transfer registry ownership to Governance
    await registry.transferOwnership(governance.address, { from: proxyDeployerAddress })
    assert.equal(await registry.owner.call(), governance.address)

    // Register contract via governance
    await _lib.registerContract(governance, governanceRegKey, governance.address, guardianAddress)

    // Export to env for reference in future migrations
    process.env.governanceAddress = governance.address
  })
}
