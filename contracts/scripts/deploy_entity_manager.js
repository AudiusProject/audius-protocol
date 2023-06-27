const EntityManager = artifacts.require('./EntityManager.sol')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    await deployer.deploy(EntityManager)
    const entityManager = await EntityManager.deployed()
    const verifierAddress = config.verifierAddress || accounts[0]
    entityManager.initialize(verifierAddress, deployer.network_id)
  })
}
