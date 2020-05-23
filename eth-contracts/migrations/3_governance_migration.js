const contractConfig = require('../contract-config.js')
const { encodeCall } = require('../utils/lib')
const _lib = require('../utils/lib')

const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const governanceRegKey = web3.utils.utf8ToHex('Governance')

// 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
const VotingPeriod = 11520
// Required number of votes on proposal
const VotingQuorum = 1

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const proxyAdminAddress = config.proxyAdminAddress || accounts[10]
    const proxyDeployerAddress = config.proxyDeployerAddress || accounts[11]

    const registryAddress = process.env.registryAddress
    const registry = await Registry.at(registryAddress)

    // Deploy Governance logic and proxy contracts + register proxy
    const governance0 = await deployer.deploy(Governance, { from: proxyDeployerAddress })
    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'uint256', 'uint256', 'address'],
      [registryAddress, VotingPeriod, VotingQuorum, proxyDeployerAddress]
    )
    const governanceProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      governance0.address,
      proxyAdminAddress,
      initializeCallData,
      _lib.addressZero,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(governanceRegKey, governanceProxy.address, { from: proxyDeployerAddress })

    console.log(`Governance proxy address: ${governanceProxy.address}`)
    let proxyAtGovernanceAddress = await AudiusAdminUpgradeabilityProxy.at(governanceProxy.address)
    let govAddrFromProxy = await proxyAtGovernanceAddress.getAudiusGovernanceAddress()

    console.log(`Governance address from proxy: ${govAddrFromProxy}`)
    await proxyAtGovernanceAddress.setAudiusGovernanceAddress(governanceProxy.address, { from: proxyAdminAddress })
    govAddrFromProxy = await proxyAtGovernanceAddress.getAudiusGovernanceAddress()
    console.log(`Governance address from proxy: ${govAddrFromProxy}`)

    // Export to env for reference in future migrations
    process.env.governanceAddress = governanceProxy.address
  })
}
