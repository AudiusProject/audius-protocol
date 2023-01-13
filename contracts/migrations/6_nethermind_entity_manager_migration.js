const EntityManager = artifacts.require('./EntityManager.sol')

module.exports = (deployer) => {
  deployer.then(async () => {
    await deployer.deploy(EntityManager)
    const instance = await EntityManager.deployed();
    instance.initialize(process.env.VERIFIER_ADDRESS, process.env.NETWORK_ID)
  })
}
