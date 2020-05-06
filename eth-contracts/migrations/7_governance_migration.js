
const contractConfig = require('../contract-config.js')
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

// 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
const VotingPeriod = 11520
// Required number of votes on proposal
const VotingQuorum = 1

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const protocolOwner = accounts[0]
    // TODO move to contractConfig
    const [proxyAdminAddress, proxyDeployerAddress] = [accounts[10], accounts[11]]
    
    const registry = await Registry.deployed()

    const initializeCallData = encodeCall(
      'initialize',
      ['address', 'bytes32', 'uint256', 'uint256'],
      [registry.address, stakingProxyKey, VotingPeriod, VotingQuorum]
    )
    
    const governance0 = await deployer.deploy(Governance, { from: protocolOwner })
    const governanceProxy = await deployer.deploy(
      AudiusAdminUpgradeabilityProxy,
      governance0.address,
      proxyAdminAddress,
      initializeCallData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )

    await registry.addContract(governanceKey, governanceProxy.address, { from: protocolOwner })
  })
}
