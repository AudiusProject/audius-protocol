const EntityManager = artifacts.require('./EntityManager.sol')

module.exports = (deployer) => {
  deployer.then(async () => {
    await deployer.deploy(EntityManager)
  })
}
