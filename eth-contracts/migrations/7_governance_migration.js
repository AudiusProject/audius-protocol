const Registry = artifacts.require('Registry')
const Governance = artifacts.require('Governance')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')

// 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
const VotingPeriod = 11520
// Required number of votes on proposal
const VotingQuorum = 1

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const protocolOwner = accounts[0]
    
    const registry = await Registry.deployed()

    const governance = await deployer.deploy(
      Governance,
      registry.address,
      stakingProxyKey,
      VotingPeriod,
      VotingQuorum,
      { from: protocolOwner }
    )

    await registry.addContract(governanceKey, governance.address, { from: protocolOwner })
  })
}