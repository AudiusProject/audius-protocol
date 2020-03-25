const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

// 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
const VotingPeriod = 11520
// Required number of votes on proposal
const VotingQuorum = 1

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const registry = await Registry.deployed()

    await deployer.deploy(
      Governance,
      registry.address,
      ownedUpgradeabilityProxyKey,
      VotingPeriod,
      VotingQuorum
    )
  })
}