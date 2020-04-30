const Registry = artifacts.require('Registry')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const registry = await deployer.deploy(Registry)
    await registry.initialize()
  })
}
