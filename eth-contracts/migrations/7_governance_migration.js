const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

const VotingPeriod = 10 // blocks

module.exports = (deployer, network, accounts) => {
  deployer.then(
    async () => {
      const registry = await Registry.deployed()
      await deployer.deploy(
        Governance,
        registry.address,
        ownedUpgradeabilityProxyKey,
        VotingPeriod
      )
    }
  )
}